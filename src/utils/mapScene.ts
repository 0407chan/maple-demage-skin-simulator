import type { RegionType } from 'type/wz'
import { readMapSceneCache, writeMapSceneCache } from './mapSceneCache'
import { loadWzImageSequence } from './wzImageAnimation'
import type { WzImageFrame, WzImageSequence, WzPoint } from './wzImageAnimation'
import type { MapleMapDetail } from 'type/map'

const WZ_API_BASE_URL = 'https://maplestory.io/api/wz'
const WZ_IMAGE_API_BASE_URL = 'https://maplestory.io/api/wz/img'
const MAP_GROUND_SAMPLE_RATIOS = [0.44, 0.46, 0.48, 0.5, 0.52, 0.54, 0.56]
const MAP_GROUND_ALPHA_THRESHOLD = 160
const MAP_GROUND_MIN_OPAQUE_COUNT = 12
const MAP_GROUND_FOOT_INSET = 18
const MAX_BACKGROUND_CACHE_ENTRIES = 12
const MAX_CONCURRENT_MAP_REQUESTS = 8
const MAP_BACKGROUND_PREVIEW_COUNT = 6

type WzNodeResponse = {
  children?: unknown
  value?: unknown
}

export type MapBackgroundLayer = {
  alpha: number
  flip: boolean
  front: boolean
  imagePath: string
  index: number
  sequence: WzImageSequence
  type: number
  x: number
  y: number
}

type MapBackgroundLoad = {
  full: Promise<MapBackgroundLayer[]>
  preview: Promise<MapBackgroundLayer[]>
}

export type MapGroundMetrics = {
  groundY: number
  height: number
  width: number
}

export type MapSceneLayout = {
  foregroundHeight: number
  foregroundWidth: number
  groundY: number
  origin: WzPoint
}

export type MapCameraBounds = {
  maxX: number
  maxY: number
  minX: number
  minY: number
}

const backgroundCache = new Map<string, MapBackgroundLoad>()
const groundMetricsCache = new Map<string, Promise<MapGroundMetrics>>()
const mapRequestQueue: Array<() => void> = []
let activeMapRequestCount = 0

const runNextMapRequest = () => {
  while (
    activeMapRequestCount < MAX_CONCURRENT_MAP_REQUESTS &&
    mapRequestQueue.length > 0
  ) {
    activeMapRequestCount += 1
    mapRequestQueue.shift()?.()
  }
}

const limitedMapFetch = (url: string) =>
  new Promise<Response>((resolve, reject) => {
    mapRequestQueue.push(() => {
      fetch(url)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeMapRequestCount -= 1
          runNextMapRequest()
        })
    })
    runNextMapRequest()
  })

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readNode = async (url: string): Promise<WzNodeResponse | undefined> => {
  const response = await limitedMapFetch(url)
  if (!response.ok) return undefined

  const data: unknown = await response.json()
  return isRecord(data) ? (data as WzNodeResponse) : undefined
}

const readChildren = (node?: WzNodeResponse) =>
  Array.isArray(node?.children)
    ? node.children.filter(
        (child): child is string => typeof child === 'string'
      )
    : []

const readValue = async (url: string) => (await readNode(url))?.value

const readChildValue = (url: string, child: string, children: string[]) =>
  children.includes(child)
    ? readValue(`${url}/${child}`)
    : Promise.resolve(undefined)

const readNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const readBoolean = (value: unknown) =>
  value === true || (typeof value === 'number' && value !== 0)

export const getMapWzBackgroundPath = (
  mapId: number,
  version: number,
  region: RegionType
) => {
  const paddedMapId = String(mapId).padStart(9, '0')
  return `${WZ_API_BASE_URL}/${region}/${version}/Map/Map/Map${paddedMapId[0]}/${paddedMapId}.img/back`
}

const getBackgroundImagePath = (
  backgroundSet: string,
  imageNumber: string,
  animated: boolean,
  version: number,
  region: RegionType
) =>
  `${WZ_API_BASE_URL}/${region}/${version}/Map/Back/${backgroundSet}.img/${animated ? 'ani' : 'back'}/${imageNumber}`

const loadBackgroundEntry = async (
  entryUrl: string,
  index: number,
  version: number,
  region: RegionType
): Promise<MapBackgroundLayer | undefined> => {
  const children = readChildren(await readNode(entryUrl))
  if (children.length === 0) return undefined

  const [backgroundSet, imageNumber, type, x, y, alpha, flip, animated, front] =
    await Promise.all([
      readChildValue(entryUrl, 'bS', children),
      readChildValue(entryUrl, 'no', children),
      readChildValue(entryUrl, 'type', children),
      readChildValue(entryUrl, 'x', children),
      readChildValue(entryUrl, 'y', children),
      readChildValue(entryUrl, 'a', children),
      readChildValue(entryUrl, 'f', children),
      readChildValue(entryUrl, 'ani', children),
      readChildValue(entryUrl, 'front', children)
    ])

  if (
    typeof backgroundSet !== 'string' ||
    (typeof imageNumber !== 'number' && typeof imageNumber !== 'string')
  ) {
    return undefined
  }

  const imagePath = getBackgroundImagePath(
    backgroundSet,
    String(imageNumber),
    readBoolean(animated),
    version,
    region
  )
  const sequence = await loadWzImageSequence(imagePath)
  const firstFrame = sequence.frames[0]
  if (!firstFrame?.src || firstFrame.width <= 0 || firstFrame.height <= 0) {
    return undefined
  }

  return {
    alpha: Math.min(1, Math.max(0, readNumber(alpha, 255) / 255)),
    flip: readBoolean(flip),
    front: readBoolean(front),
    imagePath,
    index,
    sequence,
    type: Math.trunc(readNumber(type, 0)),
    x: readNumber(x, 0),
    y: readNumber(y, 0)
  }
}

export const getMapWzImageUrl = (imagePath: string, frameIndex?: number) => {
  const framePath =
    frameIndex === undefined ? imagePath : `${imagePath}/${frameIndex}`
  return framePath.replace(`${WZ_API_BASE_URL}/`, `${WZ_IMAGE_API_BASE_URL}/`)
}

export const createCachedMapBackgroundLayers = (
  backgrounds: MapBackgroundLayer[]
) =>
  backgrounds.map((background) => ({
    ...background,
    sequence: {
      ...background.sequence,
      frames: background.sequence.frames.map((frame, frameIndex) => ({
        ...frame,
        src: frame.sourceUrl
          ? getMapWzImageUrl(frame.sourceUrl)
          : getMapWzImageUrl(
              background.imagePath,
              background.sequence.animated ? frameIndex : undefined
            )
      }))
    }
  }))

const readCachedBackgroundLoad = (cacheKey: string) => {
  const cached = backgroundCache.get(cacheKey)
  if (!cached) return undefined

  backgroundCache.delete(cacheKey)
  backgroundCache.set(cacheKey, cached)
  return cached
}

const loadBackgroundEntries = async (
  entryNames: string[],
  rootUrl: string,
  version: number,
  region: RegionType
) => {
  const backgrounds = await Promise.all(
    entryNames.map(async (entryName) => {
      try {
        return await loadBackgroundEntry(
          `${rootUrl}/${entryName}`,
          Number(entryName),
          version,
          region
        )
      } catch {
        return undefined
      }
    })
  )

  return backgrounds.filter(
    (background): background is MapBackgroundLayer => background !== undefined
  )
}

const createMapBackgroundLoad = (
  mapId: number,
  version: number,
  region: RegionType,
  cacheKey: string
): MapBackgroundLoad => {
  const persistedRequest = readMapSceneCache<MapBackgroundLayer[]>(cacheKey)
    .then((persisted) => (Array.isArray(persisted) ? persisted : undefined))
    .catch(() => undefined)
  const rootUrl = getMapWzBackgroundPath(mapId, version, region)
  const entryNamesRequest = persistedRequest.then((persisted) =>
    persisted
      ? []
      : readNode(rootUrl).then((root) =>
          readChildren(root).sort((left, right) => Number(left) - Number(right))
        )
  )

  const preview = persistedRequest.then(async (persisted) => {
    if (persisted) return persisted

    const entryNames = await entryNamesRequest
    return loadBackgroundEntries(
      entryNames.slice(0, MAP_BACKGROUND_PREVIEW_COUNT),
      rootUrl,
      version,
      region
    )
  })

  const full = persistedRequest
    .then(async (persisted) => {
      if (persisted) return persisted

      const [entryNames, previewBackgrounds] = await Promise.all([
        entryNamesRequest,
        preview
      ])
      const remainingBackgrounds = await loadBackgroundEntries(
        entryNames.slice(MAP_BACKGROUND_PREVIEW_COUNT),
        rootUrl,
        version,
        region
      )
      const backgrounds = [...previewBackgrounds, ...remainingBackgrounds].sort(
        (left, right) => left.index - right.index
      )

      if (backgrounds.length > 0) {
        void writeMapSceneCache(
          cacheKey,
          createCachedMapBackgroundLayers(backgrounds)
        )
      }

      return backgrounds
    })
    .catch((error) => {
      backgroundCache.delete(cacheKey)
      throw error
    })

  return { full, preview }
}

const getMapBackgroundLoad = (
  mapId: number,
  version: number,
  region: RegionType
) => {
  const cacheKey = `${region}/${version}/${mapId}`
  const cached = readCachedBackgroundLoad(cacheKey)
  if (cached) return cached

  const load = createMapBackgroundLoad(mapId, version, region, cacheKey)
  backgroundCache.set(cacheKey, load)
  while (backgroundCache.size > MAX_BACKGROUND_CACHE_ENTRIES) {
    const oldestKey = backgroundCache.keys().next().value
    if (oldestKey === undefined) break
    backgroundCache.delete(oldestKey)
  }

  return load
}

export const loadMapBackgroundPreviewLayers = (
  mapId: number,
  version: number,
  region: RegionType
) => getMapBackgroundLoad(mapId, version, region).preview

export const loadMapBackgroundLayers = (
  mapId: number,
  version: number,
  region: RegionType
) => getMapBackgroundLoad(mapId, version, region).full

export const getMapSceneLayout = (
  mapDetail: MapleMapDetail | undefined,
  groundMetrics: MapGroundMetrics | undefined
): MapSceneLayout => {
  const foregroundWidth = groundMetrics?.width ?? mapDetail?.miniMap?.width ?? 0
  const foregroundHeight =
    groundMetrics?.height ?? mapDetail?.miniMap?.height ?? 0
  const origin = {
    x: mapDetail?.miniMap?.centerX ?? foregroundWidth / 2,
    y:
      mapDetail?.miniMap?.centerY ??
      groundMetrics?.groundY ??
      foregroundHeight / 2
  }

  return {
    foregroundHeight,
    foregroundWidth,
    groundY: groundMetrics?.groundY ?? origin.y,
    origin
  }
}

export const getMapCameraBounds = ({
  foregroundHeight,
  foregroundTop,
  foregroundWidth,
  viewportHeight,
  viewportWidth
}: {
  foregroundHeight: number
  foregroundTop: number
  foregroundWidth: number
  viewportHeight: number
  viewportWidth: number
}): MapCameraBounds => {
  const maxX = Math.max(0, (foregroundWidth - viewportWidth) / 2)
  const canMoveVertically = foregroundHeight > viewportHeight
  const minY = canMoveVertically ? Math.min(0, foregroundTop) : 0
  const maxY = canMoveVertically
    ? Math.max(0, foregroundTop + foregroundHeight - viewportHeight)
    : 0

  return {
    maxX,
    maxY,
    minX: maxX === 0 ? 0 : -maxX,
    minY
  }
}

export const clampMapCameraX = (cameraX: number, bounds: MapCameraBounds) =>
  Math.min(bounds.maxX, Math.max(bounds.minX, cameraX))

export const clampMapCameraY = (cameraY: number, bounds: MapCameraBounds) =>
  Math.min(bounds.maxY, Math.max(bounds.minY, cameraY))

export const getMapBackgroundLayerOffsets = (
  background: MapBackgroundLayer,
  frame: WzImageFrame,
  layout: MapSceneLayout
) => {
  const x =
    layout.origin.x - layout.foregroundWidth / 2 + background.x - frame.origin.x

  return {
    x,
    flippedX: -frame.width - x,
    y: layout.origin.y + background.y - frame.origin.y
  }
}

export const findMapGroundYFromAlpha = (
  alpha: Uint8ClampedArray,
  width: number,
  height: number
) => {
  if (width <= 0 || height <= 0 || alpha.length < width * height) {
    return 0
  }

  const candidates = MAP_GROUND_SAMPLE_RATIOS.map((ratio) => {
    const x = Math.min(width - 1, Math.max(0, Math.floor(width * ratio)))
    const startY = Math.floor(height * 0.25)
    const endY = Math.floor(height * 0.96)

    for (let y = startY; y < endY; y += 1) {
      const current = alpha[y * width + x]
      const previous = y > 0 ? alpha[(y - 1) * width + x] : 0
      if (
        current <= MAP_GROUND_ALPHA_THRESHOLD ||
        previous > MAP_GROUND_ALPHA_THRESHOLD
      ) {
        continue
      }

      let opaqueCount = 0
      for (let runY = y; runY < Math.min(height, y + 16); runY += 1) {
        if (alpha[runY * width + x] > MAP_GROUND_ALPHA_THRESHOLD) {
          opaqueCount += 1
        }
      }

      if (opaqueCount >= MAP_GROUND_MIN_OPAQUE_COUNT) return y
    }

    return undefined
  })
    .filter((candidate): candidate is number => candidate !== undefined)
    .sort((left, right) => left - right)

  if (candidates.length === 0) return Math.round(height * 0.7)

  const visualGround = candidates[Math.floor(candidates.length / 2)]
  return Math.min(height - 1, visualGround + MAP_GROUND_FOOT_INSET)
}

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`맵 이미지 요청 실패: ${url}`))
    image.src = url
  })

export const measureMapGround = (url: string) => {
  const cached = groundMetricsCache.get(url)
  if (cached) return cached

  const request = loadImage(url)
    .then((image) => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('맵 바닥 측정용 Canvas를 만들 수 없습니다.')

      context.drawImage(image, 0, 0)
      const pixels = context.getImageData(
        0,
        0,
        image.naturalWidth,
        image.naturalHeight
      ).data
      const alpha = new Uint8ClampedArray(
        image.naturalWidth * image.naturalHeight
      )

      for (let index = 0; index < alpha.length; index += 1) {
        alpha[index] = pixels[index * 4 + 3]
      }

      return {
        groundY: findMapGroundYFromAlpha(
          alpha,
          image.naturalWidth,
          image.naturalHeight
        ),
        height: image.naturalHeight,
        width: image.naturalWidth
      }
    })
    .catch((error) => {
      groundMetricsCache.delete(url)
      throw error
    })

  groundMetricsCache.set(url, request)
  return request
}

export const getImageEdgeColors = async (src: string) => {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 2
  const context = canvas.getContext('2d')
  if (!context) return undefined

  const centerX = Math.max(0, Math.floor(image.naturalWidth / 2))
  context.drawImage(image, centerX, 0, 1, 1, 0, 0, 1, 1)
  context.drawImage(
    image,
    centerX,
    Math.max(0, image.naturalHeight - 1),
    1,
    1,
    0,
    1,
    1,
    1
  )
  const pixels = context.getImageData(0, 0, 1, 2).data
  const toColor = (offset: number) => {
    const alpha = pixels[offset + 3]
    return alpha === 0
      ? undefined
      : `rgb(${pixels[offset]}, ${pixels[offset + 1]}, ${pixels[offset + 2]})`
  }

  return {
    bottom: toColor(4),
    top: toColor(0)
  }
}

export const getMapBackgroundRepeat = (type: number) => {
  if ([1, 4].includes(type)) return 'repeat-x'
  if ([2, 5].includes(type)) return 'repeat-y'
  if ([3, 6, 7].includes(type)) return 'repeat'
  return 'no-repeat'
}
