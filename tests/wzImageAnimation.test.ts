import { describe, expect, test } from 'bun:test'
import {
  clearWzImageSequenceCache,
  fetchWzImageSequence,
  getWzAnimationFrameIndex,
  getWzSequenceBounds,
  loadWzImageSequence,
  WzFetch,
  WzImageFrame
} from '../src/utils/wzImageAnimation'

const PNG_1X1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+XwL7WQAAAABJRU5ErkJggg=='

const createFetcher =
  (nodes: Record<string, unknown>): WzFetch =>
  async (url) => {
    const value = nodes[url]
    return {
      ok: value !== undefined,
      status: value === undefined ? 404 : 200,
      json: async () => value
    }
  }

const createFrame = (delay: number): WzImageFrame => ({
  src: '',
  delay,
  origin: { x: 0, y: 0 },
  width: 1,
  height: 1
})

describe('WZ image animation', () => {
  test('미리 생성된 액션 스킨은 로컬 APNG 시퀀스로 읽는다', async () => {
    clearWzImageSequenceCache()
    const sequence = await loadWzImageSequence(
      'https://maplestory.io/api/wz/KMS/389/Effect/DamageSkin.img/335/NoCri1/1'
    )

    expect(sequence.frames[0].src).toContain(
      'generated/damage-skins/KMS/389/335/NoCri1/1.png'
    )
    expect(sequence.animated).toBe(true)
    expect(sequence.frames).toHaveLength(1)
  })

  test('정적 Canvas 노드는 한 프레임 이미지로 읽는다', async () => {
    const sequence = await fetchWzImageSequence(
      '/skin/NoRed0/7',
      createFetcher({
        '/skin/NoRed0/7': {
          children: ['origin'],
          type: 12,
          value: PNG_1X1
        },
        '/skin/NoRed0/7/origin': {
          children: [],
          type: 9,
          value: { x: 3, y: 4 }
        }
      })
    )

    expect(sequence.animated).toBe(false)
    expect(sequence.frames).toHaveLength(1)
    expect(sequence.frames[0]).toMatchObject({
      delay: 100,
      origin: { x: 3, y: 4 },
      sourceUrl: '/skin/NoRed0/7',
      width: 1,
      height: 1
    })
  })

  test('애니메이션 노드의 모든 프레임과 delay, origin, loop를 읽는다', async () => {
    const sequence = await fetchWzImageSequence(
      '/skin/NoCri1/1',
      createFetcher({
        '/skin/NoCri1/1': {
          children: ['1', '0', 'loop'],
          type: 13
        },
        '/skin/NoCri1/1/0': {
          children: ['delay', 'origin'],
          type: 12,
          value: PNG_1X1
        },
        '/skin/NoCri1/1/0/delay': { children: [], type: 4, value: 60 },
        '/skin/NoCri1/1/0/origin': {
          children: [],
          type: 9,
          value: { x: 5, y: 6 }
        },
        '/skin/NoCri1/1/1': {
          children: ['delay', 'origin'],
          type: 12,
          value: PNG_1X1
        },
        '/skin/NoCri1/1/1/delay': { children: [], type: 4, value: 90 },
        '/skin/NoCri1/1/1/origin': {
          children: [],
          type: 9,
          value: { x: 7, y: 8 }
        },
        '/skin/NoCri1/1/loop': { children: [], type: 3, value: 65535 }
      })
    )

    expect(sequence.animated).toBe(true)
    expect(sequence.loop).toBe(true)
    expect(sequence.frames.map((frame) => frame.delay)).toEqual([60, 90])
    expect(sequence.frames.map((frame) => frame.origin)).toEqual([
      { x: 5, y: 6 },
      { x: 7, y: 8 }
    ])
  })

  test('프레임 delay에 맞춰 반복하거나 마지막 프레임에서 멈춘다', () => {
    const frames = [createFrame(60), createFrame(90)]

    expect(getWzAnimationFrameIndex(frames, 0, true)).toBe(0)
    expect(getWzAnimationFrameIndex(frames, 59, true)).toBe(0)
    expect(getWzAnimationFrameIndex(frames, 60, true)).toBe(1)
    expect(getWzAnimationFrameIndex(frames, 150, true)).toBe(0)
    expect(getWzAnimationFrameIndex(frames, 999, false)).toBe(1)
  })

  test('프레임별 origin 차이를 포함하는 고정 표시 영역을 계산한다', () => {
    const sequence = {
      animated: true,
      loop: true,
      frames: [
        { ...createFrame(60), origin: { x: 5, y: 6 }, width: 20, height: 30 },
        { ...createFrame(60), origin: { x: 8, y: 3 }, width: 24, height: 25 }
      ]
    }

    expect(getWzSequenceBounds(sequence)).toEqual({
      left: -8,
      top: -6,
      width: 24,
      height: 30
    })
  })
})
