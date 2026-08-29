import { describe, expect, test } from 'bun:test'
import {
  getOneShotGifPlaybackDuration,
  parseGifAnimationDuration
} from '../src/utils/gifAnimation'

const graphicControlExtension = (delayCentiseconds: number) => [
  0x21,
  0xf9,
  0x04,
  0x00,
  delayCentiseconds & 0xff,
  delayCentiseconds >> 8,
  0x00,
  0x00
]

const imageFrame = [
  0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x00,
  0x00
]

const createGif = (...delays: number[]) =>
  new Uint8Array([
    ...Array.from('GIF89a', (character) => character.charCodeAt(0)),
    0x01,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x00,
    ...delays.flatMap((delay) => [
      ...graphicControlExtension(delay),
      ...imageFrame
    ]),
    0x3b
  ])

describe('GIF animation duration', () => {
  test('각 프레임의 delay를 합산해 한 바퀴 재생 시간을 계산한다', () => {
    expect(parseGifAnimationDuration(createGif(9, 12))).toBe(210)
  })

  test('두 번째 루프가 노출되기 전에 재생을 끝낸다', () => {
    expect(getOneShotGifPlaybackDuration(210, 1200)).toBe(194)
    expect(getOneShotGifPlaybackDuration(undefined, 1200)).toBe(1200)
  })

  test('GIF가 아닌 데이터는 무시한다', () => {
    expect(parseGifAnimationDuration(new Uint8Array([1, 2, 3]))).toBeUndefined()
  })
})
