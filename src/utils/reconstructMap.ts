import type { RegionType } from 'type/wz'
import type { MapleMapDetail } from 'type/map'
import { findMapGroundYFromAlpha } from './mapScene'
import type { MapBackgroundLayer, MapGroundMetrics } from './mapScene'
import { readMapSceneCache, writeMapSceneCache } from './mapSceneCache'
import { buildMapSourcePlan } from './mapSourcePlan'
import type { SourceSprite } from './mapSourcePlan'
import { createMapSourceClient } from './mapSourceClient'
import type { MapSourceProgress } from './mapSourceClient'

type DecodedImage = {
  source: CanvasImageSource
  width: number
  height: number
  close: () => void
}
export type MapRasterRuntime = {
  createCanvas: (width: number, height: number) => HTMLCanvasElement
  decode: (blob: Blob) => Promise<DecodedImage>
  encode: (canvas: HTMLCanvasElement) => Promise<Blob>
}
const browserRaster: MapRasterRuntime = {
  createCanvas: (width, height) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  },
  decode: async (blob) => {
    const image = await createImageBitmap(blob)
    return {
      source: image,
      width: image.width,
      height: image.height,
      close: () => image.close()
    }
  },
  encode: (canvas) =>
    new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error('Map image encoding failed')),
        'image/png'
      )
    )
}
type StoredMap = {
  format: 1
  foreground: Blob
  assets: Record<string, Blob>
  backgrounds: MapBackgroundLayer[]
  mapDetail: MapleMapDetail
  groundMetrics: MapGroundMetrics
  backgroundColor?: string
  stats: { tiles: number; objects: number; images: number }
}
export type ReconstructedMap = {
  mapId: number
  foregroundUrl: string
  backgrounds: MapBackgroundLayer[]
  mapDetail: MapleMapDetail
  groundMetrics: MapGroundMetrics
  backgroundColor?: string
  stats: StoredMap['stats']
  dispose: () => void
}

const materialize = (stored: StoredMap): ReconstructedMap => {
  const urls = new Map<string, string>()
  const foregroundUrl = URL.createObjectURL(stored.foreground)
  for (const [key, blob] of Object.entries(stored.assets))
    urls.set(key, URL.createObjectURL(blob))
  return {
    mapId: stored.mapDetail.id,
    foregroundUrl,
    backgrounds: stored.backgrounds.map((layer) => ({
      ...layer,
      imagePath: urls.get(layer.imagePath)!,
      sequence: {
        ...layer.sequence,
        frames: layer.sequence.frames.map((frame) => ({
          ...frame,
          src: urls.get(frame.src)!
        }))
      }
    })),
    mapDetail: stored.mapDetail,
    groundMetrics: stored.groundMetrics,
    backgroundColor: stored.backgroundColor,
    stats: stored.stats,
    dispose: () => {
      URL.revokeObjectURL(foregroundUrl)
      for (const url of urls.values()) URL.revokeObjectURL(url)
    }
  }
}

export const reconstructMap = async (options: {
  mapId: number
  region: RegionType
  version: number
  signal: AbortSignal
  onProgress?: (progress: MapSourceProgress) => void
  raster?: MapRasterRuntime
  fetcher?: typeof fetch
  cache?: boolean
  refresh?: boolean
}): Promise<ReconstructedMap> => {
  const { mapId, region, version, onProgress } = options
  const raster = options.raster ?? browserRaster
  const controller = new AbortController()
  const abort = () => controller.abort(options.signal.reason)
  options.signal.addEventListener('abort', abort, { once: true })
  const signal = controller.signal
  const images = new Map<string, { blob: Blob; image: DecodedImage }>()
  const key = `reconstructed/1/${region}/${version}/${mapId}`
  try {
    options.signal.throwIfAborted()
    onProgress?.({ phase: 'metadata', completed: 0, total: 0 })
    const stored =
      options.cache === false || options.refresh
        ? undefined
        : await readMapSceneCache<StoredMap>(key).catch(() => undefined)
    signal.throwIfAborted()
    if (
      stored?.format === 1 &&
      stored.foreground instanceof Blob &&
      Array.isArray(stored.backgrounds)
    )
      return materialize(stored)
    const client = createMapSourceClient(
      region,
      version,
      signal,
      options.fetcher
    )
    const seenMetadata = new Map<string, ReturnType<typeof client.img>>()
    let metadataDone = 0
    const plan = await buildMapSourcePlan(mapId, (path) => {
      let request = seenMetadata.get(path)
      if (!request) {
        request = client.img(path).then((tree) => {
          onProgress?.({
            phase: 'metadata',
            completed: ++metadataDone,
            total: seenMetadata.size
          })
          return tree
        })
        seenMetadata.set(path, request)
        onProgress?.({
          phase: 'metadata',
          completed: metadataDone,
          total: seenMetadata.size
        })
      }
      return request
    })
    signal.throwIfAborted()
    const sprites = [
      ...new Map(
        [...plan.placements, ...plan.backgrounds].map(({ sprite }) => [
          sprite.key,
          sprite
        ])
      ).values()
    ]
    let imageDone = 0
    onProgress?.({ phase: 'images', completed: 0, total: sprites.length })
    const loadSprite = async (sprite: SourceSprite) => {
      let lastError: unknown
      for (const path of sprite.imagePaths) {
        signal.throwIfAborted()
        const url = client.imageUrl(path)
        let decoded: DecodedImage | undefined
        try {
          const blob = new Blob([await client.request(url)], {
            type: 'image/png'
          })
          decoded = await raster.decode(blob)
          if (Math.max(decoded.width, decoded.height) <= 1)
            throw new Error(`Placeholder map sprite: ${path}`)
          signal.throwIfAborted()
          images.set(sprite.key, { blob, image: decoded })
          onProgress?.({
            phase: 'images',
            completed: ++imageDone,
            total: sprites.length
          })
          return
        } catch (error) {
          decoded?.close()
          client.invalidate(url)
          lastError = error
          signal.throwIfAborted()
        }
      }
      throw new Error(`Could not restore map sprite ${sprite.key}`, {
        cause: lastError
      })
    }
    // Keep both decoding and network fan-out bounded. Repeated placements reuse
    // one decoded sprite, including its links to the shared _Canvas collection.
    let cursor = 0
    await Promise.all(
      Array.from({ length: Math.min(6, sprites.length) }, async () => {
        while (cursor < sprites.length) await loadSprite(sprites[cursor++])
      })
    )
    signal.throwIfAborted()
    onProgress?.({
      phase: 'render',
      completed: 0,
      total: plan.placements.length
    })
    const canvas = raster.createCanvas(plan.width, plan.height)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Map canvas is unavailable')
    const origin = plan.detail.miniMap!
    for (let i = 0; i < plan.placements.length; i++) {
      const placement = plan.placements[i]
      const image = images.get(placement.sprite.key)!.image
      const spriteOrigin = placement.sprite.origin
      ctx.save()
      ctx.translate(placement.x + origin.centerX, placement.y + origin.centerY)
      if (placement.flip) ctx.scale(-1, 1)
      ctx.drawImage(image.source, -spriteOrigin.x, -spriteOrigin.y)
      ctx.restore()
      if (i % 200 === 199) {
        await new Promise((resolve) => setTimeout(resolve, 0))
        signal.throwIfAborted()
      }
    }
    const pixels = ctx.getImageData(0, 0, plan.width, plan.height).data
    const alpha = new Uint8ClampedArray(plan.width * plan.height)
    let visible = false
    for (let i = 0; i < alpha.length; i++) {
      alpha[i] = pixels[i * 4 + 3]
      visible ||= alpha[i] > 0
    }
    if (plan.placements.length && !visible)
      throw new Error('Reconstructed map is empty')
    const assets: Record<string, Blob> = {}
    const backgrounds = plan.backgrounds.map(
      ({ sprite, ...layer }): MapBackgroundLayer => {
        const { image, blob } = images.get(sprite.key)!
        assets[sprite.key] = blob
        return {
          ...layer,
          imagePath: sprite.key,
          sequence: {
            animated: false,
            loop: false,
            frames: [
              {
                src: sprite.key,
                width: image.width,
                height: image.height,
                origin: sprite.origin,
                delay: 100
              }
            ]
          }
        }
      }
    )
    let backgroundColor: string | undefined
    const first = plan.backgrounds.find((layer) => !layer.front)
    if (first) {
      const image = images.get(first.sprite.key)!.image
      const sample = raster.createCanvas(1, 1).getContext('2d')!
      sample.drawImage(
        image.source,
        Math.floor(image.width / 2),
        0,
        1,
        1,
        0,
        0,
        1,
        1
      )
      const pixel = sample.getImageData(0, 0, 1, 1).data
      if (pixel[3])
        backgroundColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
    }
    const result: StoredMap = {
      format: 1,
      foreground: await raster.encode(canvas),
      assets,
      backgrounds,
      mapDetail: plan.detail,
      backgroundColor,
      groundMetrics: {
        width: plan.width,
        height: plan.height,
        groundY: findMapGroundYFromAlpha(alpha, plan.width, plan.height)
      },
      stats: {
        tiles: plan.tileCount,
        objects: plan.objectCount,
        images: sprites.length
      }
    }
    signal.throwIfAborted()
    if (options.cache !== false)
      void writeMapSceneCache(key, result).catch(() => {})
    onProgress?.({
      phase: 'render',
      completed: plan.placements.length,
      total: plan.placements.length
    })
    return materialize(result)
  } catch (error) {
    controller.abort(error)
    throw error
  } finally {
    options.signal.removeEventListener('abort', abort)
    for (const { image } of images.values()) image.close()
  }
}
