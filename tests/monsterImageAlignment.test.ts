import { describe, expect, test } from 'bun:test'
import { getMonsterImageBottomOffset } from '../src/utils/monsterImageAlignment'

describe('monster image bottom alignment', () => {
  test('idle보다 하단 여백이 적은 hit 이미지를 위로 보정한다', () => {
    expect(
      getMonsterImageBottomOffset({
        idleMetrics: {
          naturalWidth: 110,
          naturalHeight: 120,
          transparentBottom: 39
        },
        activeMetrics: {
          naturalWidth: 86,
          naturalHeight: 86,
          transparentBottom: 0
        },
        viewportWidth: 1280,
        viewportHeight: 720
      })
    ).toBe(-39)
  })

  test('큰 이미지는 실제 표시 비율에 맞춰 여백을 축소한다', () => {
    expect(
      getMonsterImageBottomOffset({
        idleMetrics: {
          naturalWidth: 720,
          naturalHeight: 680,
          transparentBottom: 68
        },
        activeMetrics: {
          naturalWidth: 720,
          naturalHeight: 680,
          transparentBottom: 8
        },
        viewportWidth: 1280,
        viewportHeight: 720
      })
    ).toBe(-30)
  })

  test('픽셀 정보가 없으면 기존 위치를 유지한다', () => {
    expect(
      getMonsterImageBottomOffset({
        viewportWidth: 1280,
        viewportHeight: 720
      })
    ).toBe(0)
  })
})
