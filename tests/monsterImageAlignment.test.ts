import { describe, expect, test } from 'bun:test'
import { getMonsterImageAlignment } from '../src/utils/monsterImageAlignment'

describe('monster image bottom alignment', () => {
  test('idle보다 하단 여백이 적은 hit 이미지를 위로 보정한다', () => {
    expect(
      getMonsterImageAlignment({
        idleMetrics: {
          naturalWidth: 110,
          naturalHeight: 120,
          transparentLeft: 5,
          transparentRight: 5,
          transparentBottom: 39,
          transparentTop: 0
        },
        activeMetrics: {
          naturalWidth: 86,
          naturalHeight: 86,
          transparentLeft: 5,
          transparentRight: 5,
          transparentBottom: 0,
          transparentTop: 0
        },
        viewportWidth: 1280,
        viewportHeight: 720
      })
    ).toMatchObject({ bottomOffset: -39 })
  })

  test('큰 이미지는 실제 표시 비율에 맞춰 여백을 축소한다', () => {
    expect(
      getMonsterImageAlignment({
        idleMetrics: {
          naturalWidth: 720,
          naturalHeight: 680,
          transparentLeft: 20,
          transparentRight: 20,
          transparentBottom: 68,
          transparentTop: 0
        },
        activeMetrics: {
          naturalWidth: 720,
          naturalHeight: 680,
          transparentLeft: 20,
          transparentRight: 20,
          transparentBottom: 8,
          transparentTop: 0
        },
        viewportWidth: 1280,
        viewportHeight: 720
      })
    ).toMatchObject({ bottomOffset: -30 })
  })

  test('픽셀 정보가 없으면 기존 위치를 유지한다', () => {
    expect(
      getMonsterImageAlignment({
        viewportWidth: 1280,
        viewportHeight: 720
      })
    ).toEqual({ bottomOffset: 0, horizontalOffset: 0 })
  })

  test('크기와 투명 여백이 다른 사망 캔버스도 idle 배율과 중심으로 보정한다', () => {
    expect(
      getMonsterImageAlignment({
        idleMetrics: {
          naturalWidth: 125,
          naturalHeight: 166,
          transparentLeft: 5,
          transparentRight: 6,
          transparentBottom: 15,
          transparentTop: 10
        },
        activeMetrics: {
          naturalWidth: 406,
          naturalHeight: 400,
          transparentLeft: 79,
          transparentRight: 208,
          transparentBottom: 201,
          transparentTop: 118
        },
        viewportWidth: 1280,
        viewportHeight: 720
      })
    ).toEqual({
      bottomOffset: 186,
      horizontalOffset: 64,
      renderedHeight: 400,
      renderedWidth: 406
    })
  })

  test('사망 프레임의 실제 면적이 과도하게 커지면 공통 배율로 제한한다', () => {
    const alignment = getMonsterImageAlignment({
      idleMetrics: {
        naturalWidth: 266,
        naturalHeight: 177,
        transparentLeft: 15,
        transparentRight: 41,
        transparentBottom: 9,
        transparentTop: 4
      },
      activeMetrics: {
        naturalWidth: 497,
        naturalHeight: 468,
        transparentLeft: 55,
        transparentRight: 239,
        transparentBottom: 201,
        transparentTop: 103
      },
      activeAnimationMetrics: {
        frameCount: 16,
        maxOpaqueArea: 90_720,
        maxOpaqueHeight: 252,
        maxOpaqueWidth: 362
      },
      viewportWidth: 1280,
      viewportHeight: 720
    })

    const activeScale = alignment.renderedWidth! / 497
    expect(362 * activeScale).toBeLessThanOrEqual(210 * 1.4)
    expect(252 * activeScale).toBeLessThanOrEqual(164 * 1.4)
    expect(90_720 * activeScale ** 2).toBeLessThanOrEqual(
      210 * 164 * 1.8
    )
  })
})
