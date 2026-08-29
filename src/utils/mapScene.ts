import type { RegionType } from 'type/wz'
import { loadWzImageSequence } from './wzImageAnimation'
import type { WzPoint } from './wzImageAnimation'

const WZ_API_BASE_URL = 'https://maplestory.io/api/wz'
const MAP_GROUND_SAMPLE_RATIOS = [0.44, 0.46, 0.48, 0.5, 0.52, 0.54, 0.56]
const MAP_GROUND_ALPHA_THRESHOLD = 160
const MAP_GROUND_MIN_OPAQUE_COUNT = 12
const MAP_GROUND_FOOT_INSET = 18

type WzNodeResponse = {
  children?: unknown
  value?: unknown
}

export type MapBaseBackground = {
  alpha: number
  flip: boolean
  height: number
  index: number
  origin: WzPoint
  src: string
  type: number
  width: number
  x: number
  y: number
}

export type MapGroundMetrics = {
  groundY: number
  height: number
  width: number
}

const backgroundCache = new Map<
  string,
  Promise<MapBaseBackground | undefined>
>()
const groundMetricsCache = new Map<string, Promise<MapGroundMetrics>>()

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readNode = async (url: string): Promise<WzNodeResponse | undefined> => {
  const response = await fetch(url)
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
): Promise<MapBaseBackground | undefined> => {
  const front = await readValue(`${entryUrl}/front`)
  if (readBoolean(front)) return undefined

  const [backgroundSet, imageNumber, type, x, y, alpha, flip, animated] =
    await Promise.all([
      readValue(`${entryUrl}/bS`),
      readValue(`${entryUrl}/no`),
      readValue(`${entryUrl}/type`),
      readValue(`${entryUrl}/x`),
      readValue(`${entryUrl}/y`),
      readValue(`${entryUrl}/a`),
      readValue(`${entryUrl}/f`),
      readValue(`${entryUrl}/ani`)
    ])

  if (
    typeof backgroundSet !== 'string' ||
    (typeof imageNumber !== 'number' && typeof imageNumber !== 'string')
  ) {
    return undefined
  }

  const sequence = await loadWzImageSequence(
    getBackgroundImagePath(
      backgroundSet,
      String(imageNumber),
      readBoolean(animated),
      version,
      region
    )
  )
  const frame = sequence.frames[0]
  if (!frame?.src || frame.width <= 0 || frame.height <= 0) return undefined

  return {
    alpha: Math.min(1, Math.max(0, readNumber(alpha, 255) / 255)),
    flip: readBoolean(flip),
    height: frame.height,
    index,
    origin: frame.origin,
    src: frame.src,
    type: Math.trunc(readNumber(type, 0)),
    width: frame.width,
    x: readNumber(x, 0),
    y: readNumber(y, 0)
  }
}

export const loadMapBaseBackground = (
  mapId: number,
  version: number,
  region: RegionType
) => {
  const cacheKey = `${region}/${version}/${mapId}`
  const cached = backgroundCache.get(cacheKey)
  if (cached) return cached

  const request = (async () => {
    const rootUrl = getMapWzBackgroundPath(mapId, version, region)
    const entryNames = readChildren(await readNode(rootUrl)).sort(
      (left, right) => Number(left) - Number(right)
    )

    for (const entryName of entryNames) {
      const background = await loadBackgroundEntry(
        `${rootUrl}/${entryName}`,
        Number(entryName),
        version,
        region
      )
      if (background) return background
    }

    return undefined
  })().catch((error) => {
    backgroundCache.delete(cacheKey)
    throw error
  })

  backgroundCache.set(cacheKey, request)
  return request
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
