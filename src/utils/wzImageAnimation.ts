import { getPrebuiltActionSkinAsset } from 'utils/prebuiltActionSkin'

export type WzPoint = {
  x: number
  y: number
}

export type WzImageFrame = {
  src: string
  sourceUrl?: string
  delay: number
  origin: WzPoint
  width: number
  height: number
}

export type WzImageSequence = {
  frames: WzImageFrame[]
  animated: boolean
  loop: boolean
}

type WzNodeResponse = {
  children?: unknown
  value?: unknown
}

type FetchResponse = {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

export type WzFetch = (url: string) => Promise<FetchResponse>

const DEFAULT_FRAME_DELAY = 100
const MAX_SEQUENCE_CACHE_ENTRIES = 200
const MAX_CONCURRENT_REQUESTS = 8

const sequenceCache = new Map<string, Promise<WzImageSequence>>()
const requestQueue: Array<() => void> = []
let activeRequestCount = 0

const runNextRequest = () => {
  while (
    activeRequestCount < MAX_CONCURRENT_REQUESTS &&
    requestQueue.length > 0
  ) {
    activeRequestCount += 1
    requestQueue.shift()?.()
  }
}

const limitedFetch: WzFetch = (url) =>
  new Promise<FetchResponse>((resolve, reject) => {
    requestQueue.push(() => {
      fetch(url)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeRequestCount -= 1
          runNextRequest()
        })
    })
    runNextRequest()
  })

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readChildren = (node: WzNodeResponse) =>
  Array.isArray(node.children)
    ? node.children.filter(
        (child): child is string => typeof child === 'string'
      )
    : []

const readNode = async (url: string, fetcher: WzFetch) => {
  const response = await fetcher(url)
  if (!response.ok) {
    throw new Error(`WZ 노드 요청 실패: ${response.status}`)
  }

  const data: unknown = await response.json()
  if (!isRecord(data)) {
    throw new Error('WZ 노드 응답 형식이 올바르지 않습니다.')
  }

  return data as WzNodeResponse
}

const readPoint = (value: unknown): WzPoint => {
  if (!isRecord(value)) return { x: 0, y: 0 }

  return {
    x: typeof value.x === 'number' ? value.x : 0,
    y: typeof value.y === 'number' ? value.y : 0
  }
}

const readNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const readChildValue = async (
  url: string,
  child: string,
  children: string[],
  fetcher: WzFetch
) => {
  if (!children.includes(child)) return undefined
  const node = await readNode(`${url}/${child}`, fetcher)
  return node.value
}

const getPngDimensions = (base64: string) => {
  try {
    const header = atob(base64.slice(0, 32))
    if (header.length < 24 || header.slice(1, 4) !== 'PNG') {
      return { width: 0, height: 0 }
    }

    const readUint32 = (offset: number) =>
      ((header.charCodeAt(offset) << 24) |
        (header.charCodeAt(offset + 1) << 16) |
        (header.charCodeAt(offset + 2) << 8) |
        header.charCodeAt(offset + 3)) >>>
      0

    return {
      width: readUint32(16),
      height: readUint32(20)
    }
  } catch {
    return { width: 0, height: 0 }
  }
}

const createFrame = async (
  url: string,
  node: WzNodeResponse,
  fetcher: WzFetch,
  includeDelay: boolean
): Promise<WzImageFrame> => {
  if (typeof node.value !== 'string' || node.value.length === 0) {
    throw new Error('WZ 이미지 프레임에 value가 없습니다.')
  }

  const children = readChildren(node)
  const [delay, origin] = await Promise.all([
    includeDelay
      ? readChildValue(url, 'delay', children, fetcher)
      : Promise.resolve(undefined),
    readChildValue(url, 'origin', children, fetcher)
  ])
  const dimensions = getPngDimensions(node.value)

  return {
    src: `data:image/png;base64,${node.value}`,
    sourceUrl: url,
    delay: Math.max(1, readNumber(delay, DEFAULT_FRAME_DELAY)),
    origin: readPoint(origin),
    width: dimensions.width,
    height: dimensions.height
  }
}

export const fetchWzImageSequence = async (
  url: string,
  fetcher: WzFetch = limitedFetch
): Promise<WzImageSequence> => {
  const root = await readNode(url, fetcher)
  const rootChildren = readChildren(root)

  if (typeof root.value === 'string' && root.value.length > 0) {
    return {
      frames: [await createFrame(url, root, fetcher, false)],
      animated: false,
      loop: false
    }
  }

  const frameNames = rootChildren
    .filter((child) => /^\d+$/.test(child))
    .sort((left, right) => Number(left) - Number(right))

  if (frameNames.length === 0) {
    throw new Error('WZ 이미지 노드에 표시할 프레임이 없습니다.')
  }

  const [frames, loopValue] = await Promise.all([
    Promise.all(
      frameNames.map(async (frameName) => {
        const frameUrl = `${url}/${frameName}`
        const frameNode = await readNode(frameUrl, fetcher)
        return createFrame(frameUrl, frameNode, fetcher, true)
      })
    ),
    readChildValue(url, 'loop', rootChildren, fetcher)
  ])

  return {
    frames,
    animated: true,
    loop: loopValue === undefined ? false : readNumber(loopValue, 0) !== 0
  }
}

const readCachedSequence = (url: string) => {
  const cached = sequenceCache.get(url)
  if (!cached) return undefined

  sequenceCache.delete(url)
  sequenceCache.set(url, cached)
  return cached
}

export const loadWzImageSequence = (url: string) => {
  const cached = readCachedSequence(url)
  if (cached) return cached

  const prebuiltAsset = getPrebuiltActionSkinAsset(url)
  if (prebuiltAsset) {
    const request = Promise.resolve<WzImageSequence>({
      frames: [
        {
          src: prebuiltAsset.path,
          delay: prebuiltAsset.duration ?? DEFAULT_FRAME_DELAY,
          origin: prebuiltAsset.origin,
          width: prebuiltAsset.width,
          height: prebuiltAsset.height
        }
      ],
      // 브라우저가 APNG를 재생하므로 JS 프레임 타이머는 필요 없다.
      animated: prebuiltAsset.animated,
      loop: prebuiltAsset.animated
    })
    sequenceCache.set(url, request)
    return request
  }

  const request = fetchWzImageSequence(url).catch((error) => {
    sequenceCache.delete(url)
    throw error
  })
  sequenceCache.set(url, request)

  while (sequenceCache.size > MAX_SEQUENCE_CACHE_ENTRIES) {
    const oldestUrl = sequenceCache.keys().next().value
    if (oldestUrl === undefined) break
    sequenceCache.delete(oldestUrl)
  }

  return request
}

export const preloadWzImageSequences = async (
  urls: string[],
  concurrency = 4
) => {
  const uniqueUrls = [...new Set(urls)]
  let cursor = 0

  const worker = async () => {
    while (cursor < uniqueUrls.length) {
      const url = uniqueUrls[cursor]
      cursor += 1

      try {
        await loadWzImageSequence(url)
      } catch {
        // 일부 노드가 없는 스킨도 있으므로 나머지 이미지는 계속 준비한다.
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, uniqueUrls.length) }, worker)
  )
}

export const getWzSequenceBounds = (sequence: WzImageSequence) => {
  const bounds = sequence.frames.reduce(
    (result, frame) => ({
      left: Math.min(result.left, -frame.origin.x),
      top: Math.min(result.top, -frame.origin.y),
      right: Math.max(result.right, frame.width - frame.origin.x),
      bottom: Math.max(result.bottom, frame.height - frame.origin.y)
    }),
    {
      left: Number.POSITIVE_INFINITY,
      top: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY
    }
  )

  if (!Number.isFinite(bounds.left)) {
    return { left: 0, top: 0, width: 0, height: 0 }
  }

  return {
    left: bounds.left,
    top: bounds.top,
    width: Math.max(0, bounds.right - bounds.left),
    height: Math.max(0, bounds.bottom - bounds.top)
  }
}

export const getWzAnimationPlayback = (
  frames: WzImageFrame[],
  elapsed: number,
  loop: boolean
) => {
  if (frames.length <= 1) {
    return { index: 0, remaining: Number.POSITIVE_INFINITY, finished: true }
  }

  const totalDuration = frames.reduce((sum, frame) => sum + frame.delay, 0)
  if (totalDuration <= 0) {
    return { index: 0, remaining: Number.POSITIVE_INFINITY, finished: true }
  }
  if (!loop && elapsed >= totalDuration) {
    return {
      index: frames.length - 1,
      remaining: Number.POSITIVE_INFINITY,
      finished: true
    }
  }

  const position = loop
    ? ((elapsed % totalDuration) + totalDuration) % totalDuration
    : Math.max(0, elapsed)
  let cursor = 0

  for (let index = 0; index < frames.length; index += 1) {
    cursor += frames[index].delay
    if (position < cursor) {
      return {
        index,
        remaining: Math.max(1, cursor - position),
        finished: false
      }
    }
  }

  return {
    index: frames.length - 1,
    remaining: frames[frames.length - 1].delay,
    finished: false
  }
}

export const getWzAnimationFrameIndex = (
  frames: WzImageFrame[],
  elapsed: number,
  loop: boolean
) => getWzAnimationPlayback(frames, elapsed, loop).index

export const clearWzImageSequenceCache = () => {
  sequenceCache.clear()
}
