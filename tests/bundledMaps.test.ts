import { afterEach, describe, expect, mock, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import manifest from '../src/generated/mapManifest.json'
import {
  getBundledMapIconUrl,
  getBundledMapList,
  getBundledMapScene,
  restoreBundledMap
} from '../src/utils/bundledMaps'

const originalFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('bundled map library', () => {
  test('map selection, labels, coordinates and layers work with the API unavailable', () => {
    const fetch = mock(() => {
      throw new Error('Network is unavailable')
    })
    globalThis.fetch = fetch as typeof globalThis.fetch

    expect(getBundledMapList('ko').map((map) => map.name)).toEqual([
      '헤네시스',
      '헤네시스 시장',
      '작은 버섯 동산 <1>',
      '물과 햇살의 숲'
    ])
    for (const map of getBundledMapList('ko')) {
      const scene = getBundledMapScene(map.id)!
      expect(scene.mapId).toBe(map.id)
      expect(scene.backgrounds.length).toBeGreaterThan(0)
      expect(scene.groundMetrics.width).toBeGreaterThan(1000)
      expect(scene.groundMetrics.groundY).toBeGreaterThan(0)
      expect(scene.groundMetrics.groundY).toBeLessThan(
        scene.groundMetrics.height
      )
      expect(scene.foregroundUrl).toMatch(/^\/.*generated\/maps\//)
      expect(getBundledMapIconUrl(map.id)).toMatch(/^\/.*generated\/maps\//)
      for (const layer of scene.backgrounds) {
        for (const value of [layer.rx, layer.ry, layer.cx, layer.cy]) {
          expect(typeof value).toBe('number')
          expect(Number.isFinite(value)).toBe(true)
        }
        expect(layer.sequence.animated).toBe(false)
        for (const frame of layer.sequence.frames) {
          expect(frame.src).toMatch(/^\/.*generated\/maps\//)
          expect(frame.width).toBeGreaterThan(1)
          expect(frame.height).toBeGreaterThan(1)
        }
      }
    }
    expect(fetch).not.toHaveBeenCalled()
  })

  test.each([
    {
      id: 323010000,
      name: '작은 버섯 동산 <1>',
      x: 723,
      y: 313,
      width: 1530,
      height: 1152,
      layers: 14
    },
    {
      id: 450005121,
      name: '물과 햇살의 숲',
      x: 1446,
      y: 884,
      width: 2770,
      height: 1090,
      layers: 36
    }
  ])(
    'retains $name and its exact feet coordinate without replacing classic maps',
    (selected) => {
      const map = manifest.maps.find((entry) => entry.id === selected.id)!
      expect(map.source).toMatchObject({ region: 'KMS', wzVersion: 389 })
      expect(getBundledMapScene(map.id)?.placement).toEqual({
        coordinateSystem: 'map-image-pixels',
        anchor: 'monster-feet',
        x: selected.x,
        y: selected.y
      })
      expect(map.groundMetrics).toMatchObject({
        width: selected.width,
        height: selected.height
      })
      expect(map.backgrounds).toHaveLength(selected.layers)
      expect(getBundledMapList('ko', String(selected.id))[0].name).toBe(
        selected.name
      )
      expect(getBundledMapScene(100000000)).toBeDefined()
      expect(getBundledMapScene(100000100)).toBeDefined()
    }
  )

  test('searches names in every supported language and by map ID locally', () => {
    expect(getBundledMapList('en', '헤네시스')[0].name).toBe('Henesys')
    expect(getBundledMapList('ko', '  HENESYS MARKET ')[0].name).toBe(
      '헤네시스 시장'
    )
    expect(getBundledMapList('ja', '100000100')[0].name).toBe('ヘネシス市場')
    expect(getBundledMapList('zh-CN', '射手村')[0].id).toBe(100000000)
    expect(getBundledMapList('zh-TW', '弓箭手村商場')[0].id).toBe(100000100)
    expect(getBundledMapList('ko', 'missing')).toEqual([])
  })

  test('restores bundled maps and drops stale remote-only selections', () => {
    expect(restoreBundledMap({ id: 100000000, name: 'old label' })).toEqual({
      id: 100000000,
      name: '헤네시스',
      streetName: '빅토리아 아일랜드'
    })
    for (const value of [
      undefined,
      null,
      100000000,
      {},
      { id: '100000000' },
      { id: 211020000 }
    ]) {
      expect(restoreBundledMap(value)).toBeUndefined()
    }
    expect(getBundledMapScene(211020000)).toBeUndefined()
    expect(getBundledMapIconUrl(211020000)).toBeUndefined()
  })

  test('every manifest image is a committed-ready local WebP asset', () => {
    const paths = manifest.maps.flatMap((map) => [
      map.foregroundPath,
      map.iconPath,
      ...map.backgrounds.flatMap((layer) =>
        layer.sequence.frames.map((frame) => frame.src)
      )
    ])
    for (const path of paths) {
      expect(path.startsWith('generated/maps/')).toBe(true)
      expect(path.includes('..')).toBe(false)
      const file = resolve(import.meta.dir, '../public', path)
      expect(existsSync(file)).toBe(true)
      const bytes = readFileSync(file)
      expect(bytes.subarray(0, 4).toString()).toBe('RIFF')
      expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
    }
  })
})
