import { afterEach, describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import {
  getMapBackgroundPosition,
  getMapBackgroundAnchorY,
  getMapBackgroundTiling,
  hasMapBackgroundScroll
} from '../src/utils/mapBackground'
import {
  createCachedMapBackgroundLayers,
  loadMapBackgroundLayers
} from '../src/utils/mapScene'
import type { MapBackgroundLayer } from '../src/utils/mapScene'

const frame = {
  src: '/cloud.png',
  width: 300,
  height: 120,
  origin: { x: 40, y: 20 },
  delay: 100
}
const layer: MapBackgroundLayer = {
  x: 41,
  y: 78,
  rx: 0,
  ry: 0,
  cx: 0,
  cy: 0,
  type: 1,
  alpha: 1,
  flip: false,
  front: false,
  index: 0,
  imagePath: frame.src,
  sequence: { animated: false, loop: false, frames: [frame] }
}
const layout = {
  foregroundWidth: 1530,
  foregroundHeight: 1152,
  groundY: 767,
  origin: { x: -1620, y: 945 }
}
const view = {
  width: 1920,
  height: 1250,
  foregroundTop: 363,
  cameraX: 0,
  cameraY: 0,
  elapsedMs: 0
}
const position = (props: Partial<MapBackgroundLayer>, delta = {}) =>
  getMapBackgroundPosition({ ...layer, ...props }, frame, layout, {
    ...view,
    ...delta
  })

const originalFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('WZ background depth and scrolling', () => {
  test('tall PC screens preserve the original lower backdrop composition at every depth', () => {
    const classic = { ...view, height: 600, foregroundTop: -287 }
    for (const height of [720, 815, 1080, 1250, 1600]) {
      const extraHeight = height - classic.height
      for (const type of [0, 1, 3, 4, 5, 6, 7]) {
        for (const ry of [0, -5, -50, -80, -100]) {
          const background = { ...layer, type, ry }
          const original = getMapBackgroundPosition(
            background,
            frame,
            layout,
            classic
          )
          const tall = getMapBackgroundPosition(background, frame, layout, {
            ...classic,
            height,
            foregroundTop: classic.foregroundTop + extraHeight
          })
          expect(tall.y - original.y).toBeCloseTo(extraHeight)
          expect(tall.x).toBe(original.x)
        }
      }
    }
    expect(getMapBackgroundAnchorY(480)).toBe(240)
    expect(getMapBackgroundAnchorY(600)).toBe(300)
    expect(getMapBackgroundAnchorY(1250)).toBe(950)
  })

  test('Cloud Park horizon overlaps the lower cloud bands at the reported PC camera depth', () => {
    // KMS 389 skyStation layers: raw image sizes/origins, independent of assets.
    const cloudLayout = { ...layout, origin: { x: 1038, y: 2005 } }
    const pc = { ...view, height: 1250, foregroundTop: -895, cameraY: 0 }
    const boundary = (
      y: number,
      ry: number,
      originY: number,
      height: number
    ) => {
      const point = getMapBackgroundPosition(
        { ...layer, y, ry },
        { ...frame, origin: { x: 0, y: originY }, height },
        cloudLayout,
        pc
      )
      return { top: point.y, bottom: point.y + height }
    }
    const gradient = boundary(78, -5, 201, 403)
    const farCloud = boundary(139, -50, 59, 119)
    const lowerCloud = boundary(138, -80, 34, 69)
    expect(gradient.bottom).toBeGreaterThan(lowerCloud.top)
    expect(farCloud.bottom).toBeGreaterThan(lowerCloud.top)
    expect(lowerCloud.bottom).toBeGreaterThanOrEqual(pc.height)
  })

  test('fixed sky stays put while distant clouds move at their camera ratio', () => {
    expect(position({}, { cameraX: 400, cameraY: -200 })).toEqual(position({}))
    const start = position({ rx: -35, ry: -50 })
    const moved = position({ rx: -35, ry: -50 }, { cameraX: 400, cameraY: 200 })
    expect(moved.x - start.x).toBeCloseTo(-140)
    expect(moved.y - start.y).toBeCloseTo(-100)
  })

  test('world-depth layers align with map pixels, including nonzero and negative map origins', () => {
    const moved = position(
      { rx: -100, ry: -100 },
      { cameraX: 125, cameraY: -80 }
    )
    expect(moved.x).toBe(
      view.width / 2 -
        layout.foregroundWidth / 2 -
        125 +
        layout.origin.x +
        layer.x -
        frame.origin.x
    )
    expect(moved.y).toBe(
      view.foregroundTop + 80 + layout.origin.y + layer.y - frame.origin.y
    )
  })

  test('moving clouds drift independently and wrap at the WZ tile interval', () => {
    for (const type of [4, 6]) {
      const props = { type, rx: 2, ry: -13, cx: 900 }
      const start = position(props)
      expect(position(props, { elapsedMs: 1000 }).x - start.x).toBeCloseTo(10)
      expect(position(props, { elapsedMs: 90000 }).x).toBeCloseTo(start.x)
      expect(position(props, { cameraX: 200 }).x - start.x).toBeCloseTo(-200)
      expect(position(props, { cameraY: 200 }).y - start.y).toBeCloseTo(-26)
      expect(hasMapBackgroundScroll({ ...layer, ...props })).toBe(true)
    }
    for (const type of [5, 7]) {
      const props = { type, ry: -4, cy: 500 }
      expect(
        position(props, { elapsedMs: 1000 }).y - position(props).y
      ).toBeCloseTo(-20)
      expect(position(props, { elapsedMs: 25000 }).y).toBeCloseTo(
        position(props).y
      )
    }
    expect(hasMapBackgroundScroll({ ...layer, type: 4, rx: 0 })).toBe(false)
    expect(hasMapBackgroundScroll({ ...layer, type: 1, rx: -50 })).toBe(false)
  })

  test('custom repetition spacing does not stretch artwork or repeat a non-tiled axis', () => {
    expect(
      getMapBackgroundTiling({ ...layer, cx: 900, cy: 800 }, frame)
    ).toEqual({ repeat: 'repeat-x', width: 900, height: 120 })
    expect(
      getMapBackgroundTiling({ ...layer, type: 2, cx: 900, cy: 800 }, frame)
    ).toEqual({ repeat: 'repeat-y', width: 300, height: 800 })
    expect(
      getMapBackgroundTiling({ ...layer, type: 3, cx: 100, cy: 60 }, frame)
    ).toEqual({ repeat: 'repeat', width: 100, height: 60 })
    expect(
      getMapBackgroundTiling({ ...layer, type: 0, cx: 900, cy: 800 }, frame)
    ).toEqual({ repeat: 'no-repeat', width: 300, height: 120 })
    expect(getMapBackgroundTiling(layer, frame)).toEqual({
      repeat: 'repeat-x',
      width: 300,
      height: 120
    })
  })

  test('flipping changes the sprite origin, preserving camera direction', () => {
    const normal = position({ rx: -50 })
    const flipped = position({ rx: -50, flip: true })
    expect(flipped.x - normal.x).toBe(2 * frame.origin.x - frame.width)
    expect(
      position({ rx: -50, flip: true }, { cameraX: 200 }).x - flipped.x
    ).toBe(-100)
  })

  test('API background rates and spacing survive loading and persistent cache serialization', async () => {
    const root =
      'https://maplestory.io/api/wz/KMS/389/Map/Map/Map2/200010009.img/back'
    const imagePath =
      'https://maplestory.io/api/wz/KMS/389/Map/Back/parallax-test.img/back/0'
    const props = {
      bS: 'parallax-test',
      no: 0,
      type: 4,
      x: 41,
      y: 78,
      a: 255,
      f: 0,
      ani: 0,
      front: 0,
      rx: 7,
      ry: -17,
      cx: 700,
      cy: 0
    }
    const nodes: Record<string, unknown> = {
      [root]: { children: ['0'] },
      [`${root}/0`]: { children: Object.keys(props) },
      [imagePath]: {
        children: ['origin'],
        value: readFileSync(
          new URL('../src/images/hit1_0.png', import.meta.url)
        ).toString('base64')
      },
      [`${imagePath}/origin`]: { value: { x: 40, y: 20 } },
      ...Object.fromEntries(
        Object.entries(props).map(([key, value]) => [
          `${root}/0/${key}`,
          { value }
        ])
      )
    }
    globalThis.fetch = (async (input) =>
      new Response(JSON.stringify(nodes[String(input)] ?? {}), {
        status: String(input) in nodes ? 200 : 404
      })) as typeof fetch
    const loaded = await loadMapBackgroundLayers(200010009, 389, 'KMS')
    expect(loaded).toHaveLength(1)
    for (const entry of [
      loaded[0],
      createCachedMapBackgroundLayers(loaded)[0]
    ]) {
      expect(entry).toMatchObject({ rx: 7, ry: -17, cx: 700, cy: 0, type: 4 })
    }
  })
})
