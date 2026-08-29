import { describe, expect, test } from 'bun:test'
import { getMapIconUrl, getMapRenderUrl } from '../src/api/map'
import {
  findMapGroundYFromAlpha,
  getMapBackgroundRepeat,
  getMapWzBackgroundPath
} from '../src/utils/mapScene'

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
