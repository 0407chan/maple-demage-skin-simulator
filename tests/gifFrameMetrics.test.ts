import { describe, expect, test } from 'bun:test'
import { measureGifFrameOpaqueMetrics } from '../src/utils/gifFrameMetrics'

const createPatch = (width: number, height: number, alpha = 255) => {
  const patch = new Uint8ClampedArray(width * height * 4)
  for (let index = 3; index < patch.length; index += 4) patch[index] = alpha
  return patch
}

describe('GIF frame opaque metrics', () => {
  test('프레임 패치 위치와 합성 결과에서 최대 불투명 영역을 구한다', () => {
    expect(
      measureGifFrameOpaqueMetrics({
        canvasWidth: 8,
        canvasHeight: 6,
        frames: [
          {
            dims: { left: 1, top: 1, width: 2, height: 2 },
            disposalType: 1,
            patch: createPatch(2, 2)
          },
          {
            dims: { left: 4, top: 2, width: 3, height: 2 },
            disposalType: 2,
            patch: createPatch(3, 2)
          }
        ]
      })
    ).toEqual({
      frameCount: 2,
      maxOpaqueArea: 18,
      maxOpaqueHeight: 3,
      maxOpaqueWidth: 6
    })
  })

  test('restore previous 처리는 다음 프레임에 임시 픽셀을 남기지 않는다', () => {
    expect(
      measureGifFrameOpaqueMetrics({
        canvasWidth: 6,
        canvasHeight: 4,
        frames: [
          {
            dims: { left: 0, top: 0, width: 2, height: 2 },
            disposalType: 1,
            patch: createPatch(2, 2)
          },
          {
            dims: { left: 4, top: 0, width: 2, height: 2 },
            disposalType: 3,
            patch: createPatch(2, 2)
          },
          {
            dims: { left: 0, top: 3, width: 1, height: 1 },
            disposalType: 1,
            patch: createPatch(1, 1)
          }
        ]
      })
    ).toEqual({
      frameCount: 3,
      maxOpaqueArea: 12,
      maxOpaqueHeight: 4,
      maxOpaqueWidth: 6
    })
  })
})
