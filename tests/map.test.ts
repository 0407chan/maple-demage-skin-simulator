import { describe, expect, test } from 'bun:test'
import { getMapIconUrl, getMapRenderUrl } from '../src/api/map'
import {
  clampMapCameraX,
  clampMapCameraY,
  createCachedMapBackgroundLayers,
  findMapGroundYFromAlpha,
  getMapBackgroundLayerOffsets,
  getMapBackgroundRepeat,
  getMapCameraBounds,
  getMapSceneLayout,
  getMapWzBackgroundPath,
  getMapWzImageUrl
} from '../src/utils/mapScene'
import type { MapBackgroundLayer } from '../src/utils/mapScene'
import type { WzImageFrame } from '../src/utils/wzImageAnimation'

describe('map image urls', () => {
  test('현재 WZ 버전의 맵 아이콘 URL을 만든다', () => {
    expect(getMapIconUrl(100000000, 389, 'KMS')).toBe(
      'https://maplestory.io/api/KMS/389/map/100000000/icon'
    )
  })

  test('몬스터와 포탈을 제외한 맵 전경 URL을 만든다', () => {
    expect(getMapRenderUrl(100000000, 389, 'KMS')).toBe(
      'https://maplestory.io/api/KMS/389/map/100000000/render/0?showLife=false&showPortals=false&pixelAccess=1'
    )
  })
})

describe('map scene', () => {
  test('맵 ID에 맞는 WZ 배경 경로를 만든다', () => {
    expect(getMapWzBackgroundPath(10000, 389, 'KMS')).toBe(
      'https://maplestory.io/api/wz/KMS/389/Map/Map/Map0/000010000.img/back'
    )
  })

  test('WZ 배경 타입에 맞는 반복 방식을 고른다', () => {
    expect(getMapBackgroundRepeat(0)).toBe('no-repeat')
    expect(getMapBackgroundRepeat(1)).toBe('repeat-x')
    expect(getMapBackgroundRepeat(2)).toBe('repeat-y')
    expect(getMapBackgroundRepeat(3)).toBe('repeat')
    expect(getMapBackgroundRepeat(4)).toBe('repeat-x')
    expect(getMapBackgroundRepeat(5)).toBe('repeat-y')
    expect(getMapBackgroundRepeat(6)).toBe('repeat')
    expect(getMapBackgroundRepeat(7)).toBe('repeat')
  })

  test('맵 전경 원점과 WZ 배경 좌표를 같은 화면 좌표로 변환한다', () => {
    const layout = getMapSceneLayout(
      {
        id: 20000,
        name: '달팽이동산',
        streetName: '메이플로드',
        miniMap: {
          centerX: 450,
          centerY: 59,
          height: 566,
          width: 1440
        }
      },
      { groundY: 334, height: 566, width: 1440 }
    )
    const frame: WzImageFrame = {
      delay: 100,
      height: 80,
      origin: { x: 11, y: 20 },
      src: 'data:image/png;base64,test',
      width: 100
    }
    const background: MapBackgroundLayer = {
      alpha: 1,
      flip: true,
      front: false,
      imagePath:
        'https://maplestory.io/api/wz/KMS/389/Map/Back/grassySoil_new.img/back/0',
      index: 0,
      sequence: { animated: false, frames: [frame], loop: false },
      type: 1,
      x: -66,
      y: -244
    }

    expect(layout).toEqual({
      foregroundHeight: 566,
      foregroundWidth: 1440,
      groundY: 334,
      origin: { x: 450, y: 59 }
    })
    expect(getMapBackgroundLayerOffsets(background, frame, layout)).toEqual({
      x: -347,
      flippedX: 247,
      y: -205
    })
  })

  test('영속 캐시에는 base64 대신 직접 WZ PNG 주소를 저장한다', () => {
    const imagePath =
      'https://maplestory.io/api/wz/KMS/389/Map/Back/grassySoil_new.img/ani/0'
    const frame: WzImageFrame = {
      delay: 120,
      height: 80,
      origin: { x: 5, y: 6 },
      src: 'data:image/png;base64,test',
      width: 100
    }
    const background: MapBackgroundLayer = {
      alpha: 1,
      flip: false,
      front: false,
      imagePath,
      index: 0,
      sequence: {
        animated: true,
        frames: [
          frame,
          {
            ...frame,
            sourceUrl: `${imagePath}/4`,
            src: 'data:image/png;base64,next'
          }
        ],
        loop: true
      },
      type: 0,
      x: 0,
      y: 0
    }

    expect(getMapWzImageUrl(imagePath, 1)).toBe(
      'https://maplestory.io/api/wz/img/KMS/389/Map/Back/grassySoil_new.img/ani/0/1'
    )
    expect(
      createCachedMapBackgroundLayers([background])[0].sequence.frames.map(
        (cachedFrame) => cachedFrame.src
      )
    ).toEqual([
      'https://maplestory.io/api/wz/img/KMS/389/Map/Back/grassySoil_new.img/ani/0/0',
      'https://maplestory.io/api/wz/img/KMS/389/Map/Back/grassySoil_new.img/ani/0/4'
    ])
  })

  test('맵 상세 좌표가 없으면 전경 크기와 감지한 지면으로 폴백한다', () => {
    expect(
      getMapSceneLayout(undefined, {
        groundY: 118,
        height: 200,
        width: 100
      })
    ).toEqual({
      foregroundHeight: 200,
      foregroundWidth: 100,
      groundY: 118,
      origin: { x: 50, y: 118 }
    })
  })

  test('전경 너비 안에서 좌우 카메라 이동 범위를 계산한다', () => {
    expect(
      getMapCameraBounds({
        foregroundHeight: 800,
        foregroundTop: 100,
        foregroundWidth: 1440,
        viewportHeight: 1000,
        viewportWidth: 1000
      })
    ).toEqual({
      maxX: 220,
      maxY: 0,
      minX: -220,
      minY: 0
    })
    expect(
      getMapCameraBounds({
        foregroundHeight: 800,
        foregroundTop: 0,
        foregroundWidth: 800,
        viewportHeight: 1000,
        viewportWidth: 1000
      })
    ).toEqual({ maxX: 0, maxY: 0, minX: 0, minY: 0 })
  })

  test('현재 지면 정렬을 기준으로 위아래 카메라 이동 범위를 계산한다', () => {
    expect(
      getMapCameraBounds({
        foregroundHeight: 1600,
        foregroundTop: -300,
        foregroundWidth: 1000,
        viewportHeight: 1000,
        viewportWidth: 1000
      })
    ).toEqual({ maxX: 0, maxY: 300, minX: 0, minY: -300 })
  })

  test('카메라 위치가 맵 가장자리를 넘어가지 않게 제한한다', () => {
    const bounds = getMapCameraBounds({
      foregroundHeight: 1600,
      foregroundTop: -300,
      foregroundWidth: 1440,
      viewportHeight: 1000,
      viewportWidth: 1000
    })

    expect(clampMapCameraX(-400, bounds)).toBe(-220)
    expect(clampMapCameraX(75, bounds)).toBe(75)
    expect(clampMapCameraX(400, bounds)).toBe(220)
    expect(clampMapCameraY(-500, bounds)).toBe(-300)
    expect(clampMapCameraY(80, bounds)).toBe(80)
    expect(clampMapCameraY(500, bounds)).toBe(300)
  })

  test('중앙의 장식물은 제외하고 보이는 지면 안쪽을 발 위치로 잡는다', () => {
    const width = 100
    const height = 200
    const alpha = new Uint8ClampedArray(width * height)

    for (let y = 70; y < 90; y += 1) {
      for (let x = 48; x < 51; x += 1) {
        alpha[y * width + x] = 255
      }
    }
    for (let y = 100; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        alpha[y * width + x] = 255
      }
    }

    expect(findMapGroundYFromAlpha(alpha, width, height)).toBe(118)
  })
})
