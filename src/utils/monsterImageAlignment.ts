const MONSTER_MAX_WIDTH = 360
const MONSTER_MAX_HEIGHT = 340
const MONSTER_VIEWPORT_WIDTH_RATIO = 0.72
const MONSTER_VIEWPORT_HEIGHT_RATIO = 0.55

export type ImageOpaqueMetrics = {
  naturalWidth: number
  naturalHeight: number
  transparentBottom: number
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
    let opaqueBottom = -1

    findOpaquePixel: for (let y = naturalHeight - 1; y >= 0; y -= 1) {
      for (let x = 0; x < naturalWidth; x += 1) {
        if (pixels[(y * naturalWidth + x) * 4 + 3] > 0) {
          opaqueBottom = y
          break findOpaquePixel
        }
      }
    }

    if (opaqueBottom < 0) return undefined

    return {
      naturalWidth,
      naturalHeight,
      transparentBottom: naturalHeight - 1 - opaqueBottom
    }
  } catch {
    return undefined
  }
}

const getRenderedTransparentBottom = (
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
  const scale = Math.min(
    1,
    maxWidth / metrics.naturalWidth,
    maxHeight / metrics.naturalHeight
  )

  return metrics.transparentBottom * scale
}

type MonsterImageBottomOffset = {
  idleMetrics?: ImageOpaqueMetrics
  activeMetrics?: ImageOpaqueMetrics
  viewportWidth: number
  viewportHeight: number
}

export const getMonsterImageBottomOffset = ({
  idleMetrics,
  activeMetrics,
  viewportWidth,
  viewportHeight
}: MonsterImageBottomOffset) => {
  if (!idleMetrics || !activeMetrics) return 0

  return (
    getRenderedTransparentBottom(activeMetrics, viewportWidth, viewportHeight) -
    getRenderedTransparentBottom(idleMetrics, viewportWidth, viewportHeight)
  )
}
