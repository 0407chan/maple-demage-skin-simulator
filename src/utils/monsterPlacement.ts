import type { ImageOpaqueMetrics } from './monsterImageAlignment'

export type PlacementPoint = { x: number; y: number }

// Keep the selected map pixel under the feet even when the camera reaches an
// edge, or when a desktop viewport is wider than the whole map.
export const getMapPlacementX = (
  mapX: number,
  mapWidth: number,
  viewportWidth: number,
  monsterFootX: number
) => {
  const maxCameraX = Math.max(0, (mapWidth - viewportWidth) / 2)
  const desiredCameraX =
    mapX - mapWidth / 2 - (monsterFootX - viewportWidth / 2)
  const cameraX =
    maxCameraX === 0
      ? 0
      : Math.max(-maxCameraX, Math.min(maxCameraX, desiredCameraX))
  return {
    cameraX,
    monsterOffsetX:
      viewportWidth / 2 - mapWidth / 2 + mapX - cameraX - monsterFootX
  }
}

export const getMapPlacementY = (
  mapY: number,
  foregroundTop: number,
  monsterFootY: number,
  bounds: { minY: number; maxY: number }
) => {
  const desiredCameraY = foregroundTop + mapY - monsterFootY
  const cameraY = Math.max(bounds.minY, Math.min(bounds.maxY, desiredCameraY))
  return { cameraY, monsterOffsetY: desiredCameraY - cameraY }
}
export type PlacementRect = {
  left: number
  top: number
  width: number
  height: number
}

// Use the visible sprite's bottom centre, not the transparent GIF canvas edge.
export const getMonsterFootPoint = (
  rect: PlacementRect,
  metrics: ImageOpaqueMetrics,
  flipped = false
): PlacementPoint => ({
  x:
    rect.left +
    (((flipped ? metrics.transparentRight : metrics.transparentLeft) +
      (metrics.naturalWidth -
        metrics.transparentLeft -
        metrics.transparentRight) /
        2) *
      rect.width) /
      metrics.naturalWidth,
  y:
    rect.top +
    ((metrics.naturalHeight - metrics.transparentBottom) * rect.height) /
      metrics.naturalHeight
})

export const getMapPointFromScreen = (
  foot: PlacementPoint,
  imageRect: PlacementRect,
  imageSize: { width: number; height: number }
): PlacementPoint => ({
  x: Math.round(
    ((foot.x - imageRect.left) * imageSize.width) / imageRect.width
  ),
  y: Math.round(
    ((foot.y - imageRect.top) * imageSize.height) / imageRect.height
  )
})

export const formatMonsterPlacement = (
  mapId: number,
  mapName: string,
  point: PlacementPoint,
  source?: {
    region: string
    wzVersion: number
    imageWidth: number
    imageHeight: number
  }
) =>
  JSON.stringify(
    {
      mapId,
      mapName,
      coordinateSystem: 'map-image-pixels',
      anchor: 'monster-feet',
      ...source,
      ...point
    },
    null,
    2
  )
