import type { RegionType } from 'type/wz'
import { readWzImgMetadata } from './wzImgMetadata'
import type { ImgTree } from './wzImgMetadata'

const assetCache = new Map<string, ArrayBuffer>()
let cachedBytes = 0
const MAX_CACHE_BYTES = 64 * 1024 * 1024
const API = 'https://maplestory.io/api/wz'

export type MapSourceProgress = {
  phase: 'metadata' | 'images' | 'render'
  completed: number
  total: number
}

export const createMapSourceClient = (
  region: RegionType,
  version: number,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch
) => {
  let active = 0
  const queue: Array<() => void> = []
  const promises = new Map<string, Promise<ArrayBuffer>>()
  const metadata = new Map<string, Promise<ImgTree>>()
  const runNext = () => {
    while (active < 6 && queue.length) queue.shift()!()
  }
  const request = (url: string): Promise<ArrayBuffer> => {
    signal.throwIfAborted()
    const existing = promises.get(url)
    if (existing) return existing
    const cached = assetCache.get(url)
    if (cached) {
      assetCache.delete(url)
      assetCache.set(url, cached)
      return Promise.resolve(cached)
    }
    const promise = new Promise<ArrayBuffer>((resolve, reject) => {
      const start = () => {
        signal.removeEventListener('abort', cancelQueued)
        if (signal.aborted) {
          reject(signal.reason)
          runNext()
          return
        }
        active++
        const controller = new AbortController()
        const abort = () => controller.abort(signal.reason)
        signal.addEventListener('abort', abort, { once: true })
        const timer = setTimeout(
          () => controller.abort(new Error(`Map request timed out: ${url}`)),
          30000
        )
        const fetchWithRetry = async () => {
          for (let attempt = 0; ; attempt++) {
            try {
              const response = await fetcher(url, { signal: controller.signal })
              if (
                attempt === 0 &&
                (response.status >= 500 ||
                  response.status === 429 ||
                  response.status === 202)
              ) {
                await response.body?.cancel()
                await new Promise<void>((resolve, reject) => {
                  const stop = () => {
                    clearTimeout(delay)
                    reject(controller.signal.reason)
                  }
                  const delay = setTimeout(() => {
                    controller.signal.removeEventListener('abort', stop)
                    resolve()
                  }, 500)
                  controller.signal.addEventListener('abort', stop, {
                    once: true
                  })
                  if (controller.signal.aborted) stop()
                })
                continue
              }
              return response
            } catch (error) {
              if (attempt > 0 || controller.signal.aborted) throw error
            }
          }
        }
        void fetchWithRetry()
          .then(async (response) => {
            if (!response.ok || response.status === 202)
              throw new Error(`Map API ${response.status}: ${url}`)
            const data = await response.arrayBuffer()
            if (!data.byteLength) throw new Error(`Empty map response: ${url}`)
            signal.throwIfAborted()
            if (data.byteLength <= MAX_CACHE_BYTES) {
              cachedBytes -= assetCache.get(url)?.byteLength ?? 0
              assetCache.delete(url)
              assetCache.set(url, data)
              cachedBytes += data.byteLength
              while (cachedBytes > MAX_CACHE_BYTES) {
                const oldest = assetCache.keys().next().value!
                cachedBytes -= assetCache.get(oldest)!.byteLength
                assetCache.delete(oldest)
              }
            }
            resolve(data)
          })
          .catch(reject)
          .finally(() => {
            clearTimeout(timer)
            signal.removeEventListener('abort', abort)
            active--
            runNext()
          })
      }
      const cancelQueued = () => {
        const index = queue.indexOf(start)
        if (index >= 0) queue.splice(index, 1)
        reject(signal.reason)
      }
      signal.addEventListener('abort', cancelQueued, { once: true })
      queue.push(start)
      runNext()
    }).catch((error) => {
      promises.delete(url)
      throw error
    })
    promises.set(url, promise)
    return promise
  }
  const invalidate = (url: string) => {
    cachedBytes -= assetCache.get(url)?.byteLength ?? 0
    assetCache.delete(url)
    promises.delete(url)
  }
  return {
    img: (path: string) => {
      let promise = metadata.get(path)
      if (!promise) {
        const url = `${API}/export/${region}/${version}/${path}?rawImage=true`
        promise = request(url)
          .then(readWzImgMetadata)
          .catch((error) => {
            invalidate(url)
            metadata.delete(path)
            throw error
          })
        metadata.set(path, promise)
      }
      return promise
    },
    imageUrl: (path: string) => `${API}/img/${region}/${version}/${path}`,
    request,
    invalidate
  }
}
