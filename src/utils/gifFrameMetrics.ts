import { decompressFrames, parseGIF, type ParsedFrame } from 'gifuct-js'

const MAX_GIF_FRAME_COUNT = 300
const MAX_GIF_CANVAS_PIXELS = 4_000_000

export type GifAnimationOpaqueMetrics = {
  frameCount: number
  maxOpaqueArea: number
  maxOpaqueHeight: number
  maxOpaqueWidth: number
}

type GifFramePatch = Pick<
  ParsedFrame,
  'dims' | 'disposalType' | 'patch'
>

type MeasureGifFrameOptions = {
  canvasHeight: number
  canvasWidth: number
  frames: GifFramePatch[]
}

const clearFrameArea = (
  alpha: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  frame: GifFramePatch
) => {
  const startX = Math.max(0, frame.dims.left)
  const startY = Math.max(0, frame.dims.top)
  const endX = Math.min(canvasWidth, frame.dims.left + frame.dims.width)
  const endY = Math.min(canvasHeight, frame.dims.top + frame.dims.height)

  for (let y = startY; y < endY; y += 1) {
    alpha.fill(0, y * canvasWidth + startX, y * canvasWidth + endX)
  }
}

const drawFramePatch = (
  alpha: Uint8Array,
  canvasWidth: number,
  canvasHeight: number,
  frame: GifFramePatch
) => {
  const { dims, patch } = frame

  for (let patchY = 0; patchY < dims.height; patchY += 1) {
    const canvasY = dims.top + patchY
    if (canvasY < 0 || canvasY >= canvasHeight) continue

    for (let patchX = 0; patchX < dims.width; patchX += 1) {
      const canvasX = dims.left + patchX
      if (canvasX < 0 || canvasX >= canvasWidth) continue

      const patchAlpha = patch[(patchY * dims.width + patchX) * 4 + 3]
      if (patchAlpha > 0) {
        alpha[canvasY * canvasWidth + canvasX] = patchAlpha
      }
    }
  }
}

const measureAlphaBounds = (
  alpha: Uint8Array,
  canvasWidth: number,
  canvasHeight: number
) => {
  let left = canvasWidth
  let right = -1
  let top = canvasHeight
  let bottom = -1

  for (let y = 0; y < canvasHeight; y += 1) {
    for (let x = 0; x < canvasWidth; x += 1) {
      if (alpha[y * canvasWidth + x] === 0) continue

      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
    }
  }

  if (right < left || bottom < top) return undefined

  const width = right - left + 1
  const height = bottom - top + 1
  return { width, height, area: width * height }
}

export const measureGifFrameOpaqueMetrics = ({
  canvasHeight,
  canvasWidth,
  frames
}: MeasureGifFrameOptions): GifAnimationOpaqueMetrics | undefined => {
  if (
    canvasWidth <= 0 ||
    canvasHeight <= 0 ||
    canvasWidth * canvasHeight > MAX_GIF_CANVAS_PIXELS ||
    frames.length === 0 ||
    frames.length > MAX_GIF_FRAME_COUNT
  ) {
    return undefined
  }

  const alpha = new Uint8Array(canvasWidth * canvasHeight)
  let maxOpaqueArea = 0
  let maxOpaqueHeight = 0
  let maxOpaqueWidth = 0

  for (const frame of frames) {
    const restoreAlpha = frame.disposalType === 3 ? alpha.slice() : undefined
    drawFramePatch(alpha, canvasWidth, canvasHeight, frame)

    const bounds = measureAlphaBounds(alpha, canvasWidth, canvasHeight)
    if (bounds) {
      maxOpaqueArea = Math.max(maxOpaqueArea, bounds.area)
      maxOpaqueHeight = Math.max(maxOpaqueHeight, bounds.height)
      maxOpaqueWidth = Math.max(maxOpaqueWidth, bounds.width)
    }

    if (frame.disposalType === 2) {
      clearFrameArea(alpha, canvasWidth, canvasHeight, frame)
    } else if (restoreAlpha) {
      alpha.set(restoreAlpha)
    }
  }

  if (maxOpaqueArea === 0) return undefined

  return {
    frameCount: frames.length,
    maxOpaqueArea,
    maxOpaqueHeight,
    maxOpaqueWidth
  }
}

export const parseGifAnimationOpaqueMetrics = (
  input: ArrayBuffer
): GifAnimationOpaqueMetrics | undefined => {
  try {
    const gif = parseGIF(input)
    return measureGifFrameOpaqueMetrics({
      canvasHeight: gif.lsd.height,
      canvasWidth: gif.lsd.width,
      frames: decompressFrames(gif, true)
    })
  } catch {
    return undefined
  }
}
