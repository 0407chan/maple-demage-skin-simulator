import { getMapBackgroundRepeat } from './mapScene'
import type { MapBackgroundLayer, MapSceneLayout } from './mapScene'
import type { WzImageFrame } from './wzImageAnimation'

export type MapBackgroundView = {
  width: number
  height: number
  foregroundTop: number
  cameraX: number
  cameraY: number
  elapsedMs: number
}

// Legacy WZ backdrops are composed around a 600px-high view. Keep that
// composition at the bottom of taller viewports so opaque mountain/cloud strip
// edges stay covered. World-depth layers still align with the foreground.
export const getMapBackgroundAnchorY = (viewportHeight: number) =>
  viewportHeight - Math.min(viewportHeight, 600) / 2

export const getMapBackgroundTiling = (
  layer: MapBackgroundLayer,
  frame: WzImageFrame
) => {
  const repeat = getMapBackgroundRepeat(layer.type)
  const repeatX = repeat === 'repeat' || repeat === 'repeat-x'
  const repeatY = repeat === 'repeat' || repeat === 'repeat-y'
  return {
    repeat,
    width: repeatX && (layer.cx ?? 0) > 0 ? layer.cx! : frame.width,
    height: repeatY && (layer.cy ?? 0) > 0 ? layer.cy! : frame.height
  }
}

export const hasMapBackgroundScroll = (layer: MapBackgroundLayer) =>
  ((layer.type === 4 || layer.type === 6) && (layer.rx ?? 0) !== 0) ||
  ((layer.type === 5 || layer.type === 7) && (layer.ry ?? 0) !== 0)

// WZ rates: 0 = screen-fixed, -100 = world geometry, -50 = half camera speed.
// Types 4/6 scroll horizontally, 5/7 vertically at rate * 5 pixels/second.
// Semantics verified against WzComparerR2's GetMeshBack (see docs/map-backgrounds.md).
export const getMapBackgroundPosition = (
  layer: MapBackgroundLayer,
  frame: WzImageFrame,
  layout: MapSceneLayout,
  view: MapBackgroundView
) => {
  const centerX = layout.foregroundWidth / 2 - layout.origin.x + view.cameraX
  const anchorY = getMapBackgroundAnchorY(view.height)
  const centerY = anchorY - view.foregroundTop - layout.origin.y + view.cameraY
  const tiling = getMapBackgroundTiling(layer, frame)
  const scrollX = layer.type === 4 || layer.type === 6
  const scrollY = layer.type === 5 || layer.type === 7
  const rx = layer.rx ?? 0
  const ry = layer.ry ?? 0
  const xShift = scrollX
    ? -centerX + (((rx * view.elapsedMs) / 200) % tiling.width)
    : (centerX * rx) / 100
  const yShift = scrollY
    ? -centerY + (((ry * view.elapsedMs) / 200) % tiling.height)
    : (centerY * ry) / 100
  return {
    x:
      view.width / 2 +
      layer.x +
      xShift -
      (layer.flip ? frame.width - frame.origin.x : frame.origin.x),
    y: anchorY + layer.y + yShift - frame.origin.y
  }
}
