import { describe, expect, test } from 'bun:test'
import { readWzImgMetadata, findWzImgNode } from '../src/utils/wzImgMetadata'
import type { ImgNode, ImgTree } from '../src/utils/wzImgMetadata'
import {
  buildMapSourcePlan,
  createSourceSpriteResolver
} from '../src/utils/mapSourcePlan'
import { createMapSourceClient } from '../src/utils/mapSourceClient'
import { reconstructMap } from '../src/utils/reconstructMap'
import type { MapRasterRuntime } from '../src/utils/reconstructMap'

const number = (n: number) => {
  const b = Buffer.alloc(4)
  b.writeInt32LE(n)
  return b
}
const integer = (n: number) =>
  n > -128 && n < 128
    ? Buffer.from([n & 255])
    : Buffer.concat([Buffer.from([128]), number(n)])
const str = (s: string) => {
  const unicode = [...s].some((c) => c.charCodeAt(0) > 255)
  const data = Buffer.alloc(s.length * (unicode ? 2 : 1))
  for (let i = 0; i < s.length; i++) {
    if (unicode)
      data.writeUInt16LE(s.charCodeAt(i) ^ ((0xaaaa + i) & 65535), i * 2)
    else data[i] = s.charCodeAt(i) ^ ((0xaa + i) & 255)
  }
  const prefix =
    s.length < 127
      ? Buffer.from([(unicode ? s.length : -s.length) & 255])
      : Buffer.concat([Buffer.from([unicode ? 127 : 128]), number(s.length)])
  return Buffer.concat([prefix, data])
}
const value = (v: unknown): ImgNode => ({
  type:
    typeof v === 'number' ? 3 : typeof v === 'string' ? 8 : 'Shape2D#Vector2D',
  value: v,
  children: {}
})
const tree = (children: ImgTree): ImgNode => ({ type: 'Property', children })
const canvas = (children: ImgTree): ImgNode => ({ type: 'Canvas', children })
const encodeProperties = (root: ImgTree): Buffer =>
  Buffer.concat([
    Buffer.alloc(2),
    integer(Object.keys(root).length),
    ...Object.entries(root).map(([name, node]) => {
      let payload: Buffer
      if (node.type === 3)
        payload = Buffer.concat([
          Buffer.from([3]),
          integer(node.value as number)
        ])
      else if (node.type === 8)
        payload = Buffer.concat([Buffer.from([8, 0]), str(String(node.value))])
      else {
        const point = node.value as { x: number; y: number }
        const body =
          node.type === 'Canvas'
            ? Buffer.concat([
                Buffer.from([0, 1]),
                encodeProperties(node.children),
                Buffer.from('pixel payload')
              ])
            : node.type === 'Property'
              ? encodeProperties(node.children)
              : node.type === 'UOL'
                ? Buffer.concat([Buffer.from([0, 0]), str(String(node.value))])
                : Buffer.concat([integer(point.x), integer(point.y)])
        const extended = Buffer.concat([
          Buffer.from([0]),
          str(String(node.type)),
          body
        ])
        payload = Buffer.concat([
          Buffer.from([9]),
          number(extended.length),
          extended
        ])
      }
      return Buffer.concat([Buffer.from([0]), str(name), payload])
    })
  ])
const encode = (root: ImgTree) => {
  const bytes = Buffer.concat([
    Buffer.from([0x73]),
    str('Property'),
    encodeProperties(root),
    Buffer.alloc(5)
  ])
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer
}

const fixtures = (): Record<string, ImgTree> => ({
  'Map/Map/Map9/999999901.img': {
    miniMap: tree({
      width: value(20),
      height: value(20),
      centerX: value(5),
      centerY: value(6)
    }),
    '2': tree({
      info: tree({ tS: value('fixture') }),
      tile: tree({
        '0': tree({ u: value('bsc'), no: value(0), x: value(2), y: value(3) }),
        '1': tree({ u: value('bsc'), no: value(0), x: value(8), y: value(3) })
      }),
      obj: tree({
        '0': tree({
          oS: value('fixture'),
          l0: value('a'),
          l1: value('b'),
          l2: value('c'),
          z: value(9),
          f: value(1)
        })
      })
    }),
    back: tree({
      '0': tree({
        bS: value('fixture'),
        no: value(0),
        type: value(4),
        rx: value(7),
        ry: value(-17),
        cx: value(700)
      })
    })
  },
  'Map/Tile/fixture.img': {
    bsc: tree({
      '0': canvas({
        origin: value({ x: 1, y: 2 }),
        z: value(-3),
        _outlink: value('Map/Tile/_Canvas/fixture.img/bsc/0')
      }),
      '1': { type: 'UOL', value: '0', children: {} },
      '2': canvas({ origin: value({ x: 8, y: 9 }), _inlink: value('bsc/0') })
    })
  },
  'Map/Obj/fixture.img': {
    a: tree({
      b: tree({
        c: tree({
          '0': canvas({ origin: value({ x: 4, y: 5 }) }),
          '1': canvas({ origin: value({ x: 100, y: 100 }) })
        })
      })
    })
  },
  'Map/Back/fixture.img': {
    back: tree({ '0': canvas({ origin: value({ x: 0, y: 0 }) }) })
  }
})

describe('raw IMG map restoration', () => {
  test('parses nested Canvas metadata, Unicode, long strings, negative coordinates and zero padding', () => {
    const root = {
      ...fixtures()['Map/Tile/fixture.img'],
      이름: value('물과 햇살의 숲'),
      long: value('x'.repeat(200))
    }
    const decoded = readWzImgMetadata(encode(root))
    expect(findWzImgNode(decoded, 'bsc/0/origin').value).toEqual({ x: 1, y: 2 })
    expect(findWzImgNode(decoded, 'bsc/0/z').value).toBe(-3)
    expect(decoded.이름.value).toBe('물과 햇살의 숲')
    expect(decoded.long.value).toHaveLength(200)
    const broken = new Uint8Array(encode(root))
    broken[broken.length - 1] = 1
    expect(() => readWzImgMetadata(broken.buffer)).toThrow('trailing')
    expect(() => readWzImgMetadata(encode(root).slice(0, 15))).toThrow()
  })

  test('resolves UOL/inlink/outlink without replacing the instance origin; detects cycles', async () => {
    const sources = fixtures()
    const resolver = createSourceSpriteResolver(async (path) => sources[path])
    expect(
      (await resolver('Map/Tile/fixture.img', 'bsc/1')).imagePaths[0]
    ).toBe('Map/Tile/_Canvas/fixture.img/bsc/0')
    expect((await resolver('Map/Tile/fixture.img', 'bsc/2')).origin).toEqual({
      x: 8,
      y: 9
    })
    expect((await resolver('Map/Obj/fixture.img', 'a/b/c')).origin).toEqual({
      x: 4,
      y: 5
    })
    sources['Map/Tile/fixture.img'].bsc.children.loop = {
      type: 'UOL',
      value: 'loop',
      children: {}
    }
    await expect(resolver('Map/Tile/fixture.img', 'bsc/loop')).rejects.toThrow(
      'Cyclic'
    )
  })

  test('includes every tile/object, preserves z ordering and background motion metadata', async () => {
    const source = fixtures()
    const plan = await buildMapSourcePlan(
      999999901,
      async (path) => source[path]
    )
    expect(plan.tileCount).toBe(2)
    expect(plan.objectCount).toBe(1)
    expect(plan.placements.map((p) => p.z)).toEqual([-3, -3, 9])
    expect(plan.placements[2].flip).toBe(true)
    expect(plan.backgrounds[0]).toMatchObject({
      type: 4,
      rx: 7,
      ry: -17,
      cx: 700
    })
    expect(plan.detail.miniMap).toEqual({
      width: 20,
      height: 20,
      centerX: 5,
      centerY: 6
    })
  })

  test('deduplicates requests, limits parallel requests and cancels queued work', async () => {
    let running = 0,
      peak = 0,
      calls = 0
    const controller = new AbortController()
    const client = createMapSourceClient(
      'KMS',
      99991,
      controller.signal,
      (async (_url, options) => {
        calls++
        running++
        peak = Math.max(peak, running)
        try {
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(resolve, 10)
            options?.signal?.addEventListener(
              'abort',
              () => {
                clearTimeout(timer)
                reject(options.signal!.reason)
              },
              { once: true }
            )
          })
          return new Response('fixture')
        } finally {
          running--
        }
      }) as typeof fetch
    )
    const pending = Array.from({ length: 20 }, (_, i) =>
      client.request(`https://fixture.test/cancel/${i}`)
    )
    expect(client.request('https://fixture.test/cancel/0')).toBe(pending[0])
    controller.abort()
    const results = await Promise.allSettled(pending)
    expect(results.every((result) => result.status === 'rejected')).toBe(true)
    expect(calls).toBe(6)
    expect(peak).toBe(6)
  })

  test('retries temporary API failures and does not cache a failed request', async () => {
    let calls = 0
    const client = createMapSourceClient(
      'KMS',
      99992,
      new AbortController().signal,
      (async () => {
        calls++
        return new Response(calls < 3 ? 'error' : 'ok', {
          status: calls < 3 ? 503 : 200
        })
      }) as typeof fetch
    )
    await expect(client.request('https://fixture.test/retry')).rejects.toThrow(
      '503'
    )
    expect(
      new TextDecoder().decode(
        await client.request('https://fixture.test/retry')
      )
    ).toBe('ok')
    expect(calls).toBe(3)
  })

  test('restores from source APIs only, reports completed work, and rejects missing sprites', async () => {
    const sources = fixtures()
    const calls: string[] = []
    const completed: string[] = []
    let draws = 0
    let closes = 0
    const raster: MapRasterRuntime = {
      createCanvas: (width, height) =>
        ({
          getContext: () => ({
            save() {},
            restore() {},
            translate() {},
            scale() {},
            drawImage() {
              if (width > 1) draws++
            },
            getImageData: () => ({
              data: new Uint8ClampedArray(width * height * 4).fill(255)
            })
          })
        }) as unknown as HTMLCanvasElement,
      decode: async () => ({
        source: {} as CanvasImageSource,
        width: 4,
        height: 4,
        close: () => {
          closes++
        }
      }),
      encode: async () => new Blob(['restored'])
    }
    const fetcher = (async (url) => {
      calls.push(String(url))
      const path = String(url).split('/99993/')[1]?.split('?')[0]
      return new Response(
        path && sources[path]
          ? encode(sources[path])
          : new Uint8Array([1, 2, 3])
      )
    }) as typeof fetch
    const result = await reconstructMap({
      mapId: 999999901,
      region: 'KMS',
      version: 99993,
      signal: new AbortController().signal,
      fetcher,
      raster,
      cache: false,
      onProgress: (progress) => {
        if (
          progress.phase === 'render' &&
          progress.completed === progress.total
        )
          completed.push('ready')
      }
    })
    expect(result.stats).toEqual({ tiles: 2, objects: 1, images: 3 })
    expect(draws).toBe(3)
    expect(closes).toBe(3)
    expect(completed).toEqual(['ready'])
    expect(calls.every((url) => !url.includes('/render'))).toBe(true)
    expect(result.foregroundUrl.startsWith('blob:')).toBe(true)
    expect(
      result.backgrounds[0].sequence.frames[0].src.startsWith('blob:')
    ).toBe(true)
    result.dispose()
    const failing = (async (url) => {
      const path = String(url).split('/99994/')[1]?.split('?')[0]
      return path && sources[path]
        ? new Response(encode(sources[path]))
        : new Response('missing', { status: 404 })
    }) as typeof fetch
    await expect(
      reconstructMap({
        mapId: 999999901,
        region: 'KMS',
        version: 99994,
        signal: new AbortController().signal,
        fetcher: failing,
        raster,
        cache: false
      })
    ).rejects.toThrow('Could not restore map sprite')
  })
})
