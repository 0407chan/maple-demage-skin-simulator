import {
  ImageOpaqueMetrics,
  measureImageOpaqueMetrics
} from './monsterImageAlignment'

const MAX_CACHE_ENTRIES = 80
const IMAGE_LOAD_TIMEOUT_MS = 10000

const imageCache = new Map<string, HTMLImageElement>()
const imageMetricsCache = new Map<string, ImageOpaqueMetrics>()
const pendingRequests = new Map<string, Promise<void>>()

export const getCachedImageMetrics = (url: string) => imageMetricsCache.get(url)

export const cacheImageMetrics = (url: string, image: HTMLImageElement) => {
  const metrics = measureImageOpaqueMetrics(image)
  if (metrics) imageMetricsCache.set(url, metrics)
  return metrics
}

const readCachedImage = (url: string) => {
  const cachedImage = imageCache.get(url)
  if (!cachedImage) return undefined

  imageCache.delete(url)
  imageCache.set(url, cachedImage)
  return cachedImage
}

const cacheImage = (url: string, image: HTMLImageElement) => {
  imageCache.delete(url)
  imageCache.set(url, image)
  cacheImageMetrics(url, image)

  while (imageCache.size > MAX_CACHE_ENTRIES) {
    const oldestUrl = imageCache.keys().next().value
    if (oldestUrl === undefined) break
    imageCache.delete(oldestUrl)
    imageMetricsCache.delete(oldestUrl)
  }
}

export const preloadImage = (url: string): Promise<void> => {
  const cachedImage = readCachedImage(url)
  if (cachedImage) {
    if (!getCachedImageMetrics(url)) cacheImageMetrics(url, cachedImage)
    return Promise.resolve()
  }

  const pendingRequest = pendingRequests.get(url)
  if (pendingRequest) return pendingRequest

  const request = new Promise<void>((resolve, reject) => {
    const image = new Image()
    const timeout = window.setTimeout(() => {
      image.src = ''
      reject(new Error(`이미지 요청 시간 초과: ${url}`))
    }, IMAGE_LOAD_TIMEOUT_MS)
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => {
      window.clearTimeout(timeout)
      cacheImage(url, image)
      resolve()
    }
    image.onerror = () => {
      window.clearTimeout(timeout)
      reject(new Error(`이미지 요청 실패: ${url}`))
    }
    image.src = url
  }).finally(() => {
    pendingRequests.delete(url)
  })

  pendingRequests.set(url, request)
  return request
}

export const preloadImages = async (urls: string[]) => {
  const uniqueUrls = [...new Set(urls)]
  await Promise.allSettled(uniqueUrls.map(preloadImage))
}
