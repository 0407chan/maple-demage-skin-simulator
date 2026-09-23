import { describe, expect, test } from 'bun:test'
import {
  formatMonsterPlacement,
  getMapPlacementX,
  getMapPlacementY,
  getMapPointFromScreen,
  getMonsterFootPoint
} from '../src/utils/monsterPlacement'
import { getMapCameraBounds } from '../src/utils/mapScene'

describe('monster placement coordinates', () => {
  test('restores the chosen feet coordinate on wide PC, narrow PC and mobile viewports', () => {
    const size = { width: 1530, height: 1152 }
    for (const viewport of [
      { width: 1740, height: 1258 },
      { width: 1280, height: 720 },
      { width: 390, height: 844 }
    ]) {
      for (const point of [
        { x: 723, y: 313 },
        { x: 45, y: 80 },
        { x: 1490, y: 1080 }
      ]) {
        const feet = { x: viewport.width / 2 + 3, y: viewport.height - 120 }
        const foregroundTop = feet.y - 760
        const bounds = getMapCameraBounds({
          foregroundWidth: size.width,
          foregroundHeight: size.height,
          foregroundTop,
          viewportWidth: viewport.width,
          viewportHeight: viewport.height
        })
        const horizontal = getMapPlacementX(
          point.x,
          size.width,
          viewport.width,
          feet.x
        )
        const vertical = getMapPlacementY(
          point.y,
          foregroundTop,
          feet.y,
          bounds
        )
        expect(horizontal.cameraX).toBeGreaterThanOrEqual(bounds.minX)
        expect(horizontal.cameraX).toBeLessThanOrEqual(bounds.maxX)
        expect(vertical.cameraY).toBeGreaterThanOrEqual(bounds.minY)
        expect(vertical.cameraY).toBeLessThanOrEqual(bounds.maxY)
        expect(
          getMapPointFromScreen(
            {
              x: feet.x + horizontal.monsterOffsetX,
              y: feet.y + vertical.monsterOffsetY
            },
            {
              left: viewport.width / 2 - size.width / 2 - horizontal.cameraX,
              top: foregroundTop - vertical.cameraY,
              ...size
            },
            size
          )
        ).toEqual(point)
      }
    }
  })

  test('anchors the visible feet, including sprite scale and facing direction', () => {
    const rect = { left: 200, top: 300, width: 50, height: 60 }
    const metrics = {
      naturalWidth: 100,
      naturalHeight: 120,
      transparentLeft: 10,
      transparentRight: 30,
      transparentBottom: 20
    }
    expect(getMonsterFootPoint(rect, metrics)).toEqual({ x: 220, y: 350 })
    expect(getMonsterFootPoint(rect, metrics, true)).toEqual({ x: 230, y: 350 })
  })

  test('reports the same original-image point across viewport scale and camera offsets', () => {
    const size = { width: 2000, height: 1600 }
    expect(
      getMapPointFromScreen(
        { x: 400, y: 300 },
        { left: -300, top: -600, ...size },
        size
      )
    ).toEqual({ x: 700, y: 900 })
    expect(
      getMapPointFromScreen(
        { x: 300, y: 350 },
        { left: -50, top: -100, width: 1000, height: 800 },
        size
      )
    ).toEqual({ x: 700, y: 900 })
  })

  test('copy includes the map identity and unambiguous coordinate anchor', () => {
    expect(
      JSON.parse(
        formatMonsterPlacement(104020000, '헤네시스 서쪽숲', {
          x: 1500,
          y: 800
        })
      )
    ).toEqual({
      mapId: 104020000,
      mapName: '헤네시스 서쪽숲',
      coordinateSystem: 'map-image-pixels',
      anchor: 'monster-feet',
      x: 1500,
      y: 800
    })
  })

  test('copy pins the restored image version and dimensions for a later build export', () => {
    const source = {
      region: 'KMS',
      wzVersion: 389,
      imageWidth: 2770,
      imageHeight: 1090
    }
    expect(
      JSON.parse(
        formatMonsterPlacement(
          450005121,
          '물과 햇살의 숲',
          { x: 1000, y: 360 },
          source
        )
      )
    ).toMatchObject({
      ...source,
      mapId: 450005121,
      x: 1000,
      y: 360,
      coordinateSystem: 'map-image-pixels',
      anchor: 'monster-feet'
    })
  })
})
