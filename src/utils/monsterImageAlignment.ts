import { GifAnimationOpaqueMetrics } from './gifFrameMetrics'

const MONSTER_MAX_WIDTH = 360
const MONSTER_MAX_HEIGHT = 340
const MONSTER_VIEWPORT_WIDTH_RATIO = 0.72
const MONSTER_VIEWPORT_HEIGHT_RATIO = 0.55
const MAX_ACTIVE_OPAQUE_WIDTH_RATIO = 1.4
const MAX_ACTIVE_OPAQUE_HEIGHT_RATIO = 1.4
const MAX_ACTIVE_OPAQUE_AREA_RATIO = 1.8

export type ImageOpaqueMetrics = {
  naturalWidth: number
  naturalHeight: number
  transparentLeft: number
  transparentRight: number
  transparentBottom: number
  transparentTop?: number
}

export const measureImageOpaqueMetrics = (
  image: HTMLImageElement
): ImageOpaqueMetrics | undefined => {
  const { naturalWidth, naturalHeight } = image
  if (naturalWidth <= 0 || naturalHeight <= 0) return undefined

  try {
    const canvas = document.createElement('canvas')
    canvas.width = naturalWidth
    canvas.height = naturalHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return undefined

    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, naturalWidth, naturalHeight).data
    let opaqueLeft = naturalWidth
    let opaqueRight = -1
    let opaqueTop = naturalHeight
    let opaqueBottom = -1

    for (let y = 0; y < naturalHeight; y += 1) {
      for (let x = 0; x < naturalWidth; x += 1) {
        if (pixels[(y * naturalWidth + x) * 4 + 3] > 0) {
          opaqueLeft = Math.min(opaqueLeft, x)
          opaqueRight = Math.max(opaqueRight, x)
          opaqueTop = Math.min(opaqueTop, y)
          opaqueBottom = Math.max(opaqueBottom, y)
        }
      }
    }

    if (opaqueBottom < 0) return undefined

    return {
      naturalWidth,
      naturalHeight,
      transparentLeft: opaqueLeft,
      transparentRight: naturalWidth - 1 - opaqueRight,
      transparentBottom: naturalHeight - 1 - opaqueBottom,
      transparentTop: opaqueTop
    }
  } catch {
    return undefined
  }
}

const getRenderedScale = (
  metrics: ImageOpaqueMetrics,
  viewportWidth: number,
  viewportHeight: number
) => {
  const maxWidth = Math.min(
    MONSTER_MAX_WIDTH,
    viewportWidth * MONSTER_VIEWPORT_WIDTH_RATIO
  )
  const maxHeight = Math.min(
    MONSTER_MAX_HEIGHT,
    viewportHeight * MONSTER_VIEWPORT_HEIGHT_RATIO
  )
  return Math.min(
    1,
    maxWidth / metrics.naturalWidth,
    maxHeight / metrics.naturalHeight
  )
}

type MonsterImageAlignmentOptions = {
  idleMetrics?: ImageOpaqueMetrics
  activeMetrics?: ImageOpaqueMetrics
  activeAnimationMetrics?: GifAnimationOpaqueMetrics
  viewportWidth: number
  viewportHeight: number
}

export type MonsterImageAlignment = {
  bottomOffset: number
  horizontalOffset: number
  renderedHeight?: number
  renderedWidth?: number
}

export type MonsterFacingDirection = 'left' | 'right'

export const getMonsterImageTransform = (
  horizontalOffset: number,
  facingDirection: MonsterFacingDirection
) => {
  const facingScale = facingDirection === 'right' ? -1 : 1
  return `translateX(${horizontalOffset * facingScale}px) scaleX(${facingScale})`
}

const getOpaqueCenterOffset = (metrics: ImageOpaqueMetrics) => {
  const opaqueLeft = metrics.transparentLeft
  const opaqueRight = metrics.naturalWidth - 1 - metrics.transparentRight
  const opaqueCenter = (opaqueLeft + opaqueRight) / 2
  const imageCenter = (metrics.naturalWidth - 1) / 2

  return opaqueCenter - imageCenter
}

const getOpaqueSize = (metrics: ImageOpaqueMetrics) => ({
  height:
    metrics.naturalHeight -
    metrics.transparentBottom -
    (metrics.transparentTop ?? 0),
  width:
    metrics.naturalWidth -
    metrics.transparentLeft -
    metrics.transparentRight
})

const getActiveAnimationScale = (
  idleMetrics: ImageOpaqueMetrics,
  activeAnimationMetrics: GifAnimationOpaqueMetrics | undefined
) => {
  if (!activeAnimationMetrics) return 1

  const idleOpaqueSize = getOpaqueSize(idleMetrics)
  const idleOpaqueArea = idleOpaqueSize.width * idleOpaqueSize.height
  if (
    idleOpaqueSize.width <= 0 ||
    idleOpaqueSize.height <= 0 ||
    idleOpaqueArea <= 0
  ) {
    return 1
  }

  return Math.min(
    1,
    (idleOpaqueSize.width * MAX_ACTIVE_OPAQUE_WIDTH_RATIO) /
      activeAnimationMetrics.maxOpaqueWidth,
    (idleOpaqueSize.height * MAX_ACTIVE_OPAQUE_HEIGHT_RATIO) /
      activeAnimationMetrics.maxOpaqueHeight,
    Math.sqrt(
      (idleOpaqueArea * MAX_ACTIVE_OPAQUE_AREA_RATIO) /
        activeAnimationMetrics.maxOpaqueArea
    )
  )
}

export const getMonsterImageAlignment = ({
  idleMetrics,
  activeMetrics,
  activeAnimationMetrics,
  viewportWidth,
  viewportHeight
}: MonsterImageAlignmentOptions): MonsterImageAlignment => {
  if (!idleMetrics || !activeMetrics) {
    return { bottomOffset: 0, horizontalOffset: 0 }
  }

  // 액션마다 캔버스 크기가 달라도 기본 배율은 idle에 맞춘다. 단, 사망 GIF
  // 중 실제 픽셀 영역이 과도하게 커지는 프레임은 전체 프레임 분석값으로 제한한다.
  const idleScale = getRenderedScale(
    idleMetrics,
    viewportWidth,
    viewportHeight
  )
  const activeScale =
    idleScale * getActiveAnimationScale(idleMetrics, activeAnimationMetrics)

  return {
    bottomOffset:
      activeMetrics.transparentBottom * activeScale -
      idleMetrics.transparentBottom * idleScale,
    horizontalOffset:
      getOpaqueCenterOffset(idleMetrics) * idleScale -
      getOpaqueCenterOffset(activeMetrics) * activeScale,
    renderedHeight: activeMetrics.naturalHeight * activeScale,
    renderedWidth: activeMetrics.naturalWidth * activeScale
  }
}
