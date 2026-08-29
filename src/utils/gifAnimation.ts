const GIF_TRAILER = 0x3b
const EXTENSION_INTRODUCER = 0x21
const GRAPHIC_CONTROL_EXTENSION = 0xf9
const IMAGE_DESCRIPTOR = 0x2c
const MINIMUM_FRAME_DELAY_MS = 20
const LOOP_END_GUARD_MS = 16

export type GifAnimationAsset = {
  blob: Blob
  durationMs?: number
  opaqueMetrics?: GifAnimationOpaqueMetrics
}

const animationAssetRequestCache = new Map<
  string,
  Promise<GifAnimationAsset | undefined>
>()

const skipSubBlocks = (bytes: Uint8Array, startOffset: number) => {
  let offset = startOffset

  while (offset < bytes.length) {
    const blockLength = bytes[offset]
    offset += 1
    if (blockLength === 0) return offset
    offset += blockLength
  }

  return undefined
}

const getColorTableLength = (packedField: number) =>
  3 * 2 ** ((packedField & 0x07) + 1)

export const parseGifAnimationDuration = (
  input: ArrayBuffer | Uint8Array
): number | undefined => {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  const signature = String.fromCharCode(...bytes.slice(0, 6))
  if ((signature !== 'GIF87a' && signature !== 'GIF89a') || bytes.length < 13) {
    return undefined
  }

  const logicalScreenPackedField = bytes[10]
  let offset = 13
  if ((logicalScreenPackedField & 0x80) !== 0) {
    offset += getColorTableLength(logicalScreenPackedField)
  }

  let pendingFrameDelayMs = MINIMUM_FRAME_DELAY_MS
  let durationMs = 0
  let frameCount = 0

  while (offset < bytes.length) {
    const blockType = bytes[offset]
    offset += 1

    if (blockType === GIF_TRAILER) break

    if (blockType === EXTENSION_INTRODUCER) {
      if (offset >= bytes.length) return undefined
      const extensionType = bytes[offset]
      offset += 1

      if (extensionType === GRAPHIC_CONTROL_EXTENSION) {
        const blockLength = bytes[offset]
        offset += 1
        if (blockLength < 4 || offset + blockLength >= bytes.length) {
          return undefined
        }

        const delayCentiseconds = bytes[offset + 1] | (bytes[offset + 2] << 8)
        pendingFrameDelayMs = Math.max(
          MINIMUM_FRAME_DELAY_MS,
          delayCentiseconds * 10
        )
        offset += blockLength
        if (bytes[offset] !== 0) return undefined
        offset += 1
      } else {
        const nextOffset = skipSubBlocks(bytes, offset)
        if (nextOffset === undefined) return undefined
        offset = nextOffset
      }

      continue
    }

    if (blockType !== IMAGE_DESCRIPTOR || offset + 9 > bytes.length) {
      return undefined
    }

    const imagePackedField = bytes[offset + 8]
    offset += 9
    if ((imagePackedField & 0x80) !== 0) {
      offset += getColorTableLength(imagePackedField)
    }

    // LZW minimum code size 뒤에 이미지 데이터 sub-block이 이어진다.
    offset += 1
    const nextOffset = skipSubBlocks(bytes, offset)
    if (nextOffset === undefined) return undefined
    offset = nextOffset
    durationMs += pendingFrameDelayMs
    frameCount += 1
    pendingFrameDelayMs = MINIMUM_FRAME_DELAY_MS
  }

  return frameCount > 0 ? durationMs : undefined
}

export const getOneShotGifPlaybackDuration = (
  animationDurationMs: number | undefined,
  fallbackDurationMs: number
) =>
  animationDurationMs === undefined
    ? fallbackDurationMs
    : Math.max(1, animationDurationMs - LOOP_END_GUARD_MS)

export const getGifAnimationAssetFromUrl = (url: string) => {
  const cachedRequest = animationAssetRequestCache.get(url)
  if (cachedRequest) return cachedRequest

  const request = fetch(url, { cache: 'force-cache' })
    .then(async (response) => {
      if (!response.ok) return undefined

      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      return {
        blob,
        durationMs: parseGifAnimationDuration(arrayBuffer),
        opaqueMetrics: parseGifAnimationOpaqueMetrics(arrayBuffer)
      }
    })
    .catch(() => undefined)

  animationAssetRequestCache.set(url, request)
  return request
}

export const getGifAnimationDurationFromUrl = (url: string) =>
  getGifAnimationAssetFromUrl(url).then((asset) => asset?.durationMs)
import {
  GifAnimationOpaqueMetrics,
  parseGifAnimationOpaqueMetrics
} from './gifFrameMetrics'
