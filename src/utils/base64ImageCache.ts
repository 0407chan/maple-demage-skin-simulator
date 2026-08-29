type Base64ImageResponse = {
  value?: string
}

const MAX_CACHE_ENTRIES = 160
const DEFAULT_PRELOAD_CONCURRENCY = 6

const imageCache = new Map<string, string>()
const pendingRequests = new Map<string, Promise<string>>()

const readCachedImage = (url: string) => {
  const cachedImage = imageCache.get(url)
  if (!cachedImage) return undefined

  imageCache.delete(url)
  imageCache.set(url, cachedImage)
  return cachedImage
}

const cacheImage = (url: string, image: string) => {
  imageCache.delete(url)
  imageCache.set(url, image)

  while (imageCache.size > MAX_CACHE_ENTRIES) {
    const oldestUrl = imageCache.keys().next().value
    if (oldestUrl === undefined) break
    imageCache.delete(oldestUrl)
  }
}

export const getCachedBase64Image = (url: string) => imageCache.get(url)

export const loadBase64Image = (url: string): Promise<string> => {
  const cachedImage = readCachedImage(url)
  if (cachedImage) return Promise.resolve(cachedImage)

  const pendingRequest = pendingRequests.get(url)
  if (pendingRequest) return pendingRequest

  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`이미지 요청 실패: ${response.status}`)
      }

      const data = (await response.json()) as Base64ImageResponse
      if (!data.value) {
        throw new Error('이미지 응답에 value가 없습니다.')
      }

      const image = `data:image/png;base64,${data.value}`
      cacheImage(url, image)
      return image
    })
    .finally(() => {
      pendingRequests.delete(url)
    })

  pendingRequests.set(url, request)
  return request
}

export const preloadBase64Images = async (
  urls: string[],
  concurrency = DEFAULT_PRELOAD_CONCURRENCY
) => {
  const uniqueUrls = [...new Set(urls)]
  let cursor = 0

  const worker = async () => {
    while (cursor < uniqueUrls.length) {
      const currentUrl = uniqueUrls[cursor]
      cursor += 1

      try {
        await loadBase64Image(currentUrl)
      } catch {
        // 개별 이미지 실패는 실제 렌더링 시 다시 시도할 수 있도록 캐시하지 않는다.
      }
    }
  }

  const workerCount = Math.min(Math.max(1, concurrency), uniqueUrls.length)
  await Promise.all(Array.from({ length: workerCount }, worker))
}
