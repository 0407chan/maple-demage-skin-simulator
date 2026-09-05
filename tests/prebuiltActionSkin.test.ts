import { describe, expect, spyOn, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { SkinMap } from '../src/constants/damageSkinMapper'
import manifest from '../src/generated/actionDamageSkinManifest.json'
import { getPrebuiltActionSkinUrls } from '../src/utils/prebuiltActionSkin'
import {
  clearWzImageSequenceCache,
  loadWzImageSequence
} from '../src/utils/wzImageAnimation'

const baseUrl = (index: number, version = manifest.wzVersion) =>
  `https://maplestory.io/api/wz/${manifest.region}/${version}/Effect/DamageSkin.img/${index}`

describe('배포용 액션 스킨 묶음', () => {
  test('선택 가능한 11종의 숫자와 유닛 문자를 모두 포함한다', () => {
    expect(
      manifest.skins.map((skin) => skin.index).sort((a, b) => a - b)
    ).toEqual([319, 321, 324, 326, 330, 332, 335, 337, 338, 350, 351])
    for (const skin of manifest.skins) {
      for (const id of skin.itemIds) expect(SkinMap[id]).toContain(skin.index)
      const urls = getPrebuiltActionSkinUrls(baseUrl(skin.index))!
      for (const type of ['NoCri0', 'NoCri1', 'NoRed0', 'NoRed1']) {
        for (let digit = 0; digit < 10; digit++) {
          expect(urls).toContain(`${baseUrl(skin.index)}/${type}/${digit}`)
        }
      }
      expect(urls).toContain(`${baseUrl(skin.index)}/NoCri1/effect3`)
      const isUnit = skin.names.some((name) => name.includes('유닛'))
      expect(urls).toHaveLength(isUnit ? 45 : 41)
    }
  })

  test('WZ 버전이 올라가도 모든 기존 묶음은 프레임 API 요청 없이 로드된다', async () => {
    clearWzImageSequenceCache()
    const fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(async () => {
      throw new Error('액션 스킨이 외부 API를 호출했습니다.')
    })
    try {
      for (const version of [
        manifest.wzVersion,
        manifest.wzVersion + 1,
        manifest.wzVersion + 25
      ]) {
        for (const skin of manifest.skins) {
          const urls = getPrebuiltActionSkinUrls(baseUrl(skin.index, version))!
          expect(urls).toHaveLength(
            skin.names.some((name) => name.includes('유닛')) ? 45 : 41
          )
          for (const url of [...urls, ...urls]) {
            expect(url).toStartWith(baseUrl(skin.index, version))
            const sequence = await loadWzImageSequence(url)
            expect(sequence.frames).toHaveLength(1)
            expect(sequence.frames[0].src).toStartWith(
              `generated/damage-skins/${manifest.region}/${manifest.wzVersion}/${skin.index}/`
            )
          }
        }
      }
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      fetchSpy.mockRestore()
      clearWzImageSequenceCache()
    }
  })

  test('매니페스트의 PNG/APNG 파일과 크기, 프레임 수가 일치한다', () => {
    for (const asset of Object.values(manifest.assets)) {
      const bytes = readFileSync(
        new URL(`../public/${asset.path}`, import.meta.url)
      )
      expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      expect(bytes.readUInt32BE(16)).toBe(asset.width)
      expect(bytes.readUInt32BE(20)).toBe(asset.height)
      let frames = 1
      for (let offset = 8; offset < bytes.length; ) {
        const length = bytes.readUInt32BE(offset)
        if (bytes.toString('ascii', offset + 4, offset + 8) === 'acTL') {
          frames = bytes.readUInt32BE(offset + 8)
        }
        offset += length + 12
      }
      expect(frames).toBe(asset.frameCount)
      expect(frames > 1).toBe(asset.animated)
    }
  })

  test('다른 지역과 묶음에 없는 스킨에는 로컬 자산을 매핑하지 않는다', () => {
    expect(
      getPrebuiltActionSkinUrls(baseUrl(330).replace('/KMS/', '/GMS/'))
    ).toBeUndefined()
    expect(getPrebuiltActionSkinUrls(baseUrl(0))).toBeUndefined()
  })

  test('묶음에 없는 새 액션 스킨은 요청한 최신 WZ 버전의 API로 로드한다', async () => {
    clearWzImageSequenceCache()
    const url = `${baseUrl(999999, manifest.wzVersion + 1)}/NoCri0/0`
    const png =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+XwL7WQAAAABJRU5ErkJggg=='
    const fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(
      async (input) => {
        const data =
          String(input) === url
            ? { children: ['0', '1'] }
            : { children: [], value: png }
        return new Response(JSON.stringify(data))
      }
    )
    try {
      expect(
        getPrebuiltActionSkinUrls(baseUrl(999999, manifest.wzVersion + 1))
      ).toBeUndefined()
      const sequence = await loadWzImageSequence(url)
      expect(sequence.animated).toBe(true)
      expect(sequence.frames.map((frame) => frame.sourceUrl)).toEqual([
        `${url}/0`,
        `${url}/1`
      ])
      expect(fetchSpy.mock.calls.map(([input]) => input)).toEqual([
        url,
        `${url}/0`,
        `${url}/1`
      ])
    } finally {
      fetchSpy.mockRestore()
      clearWzImageSequenceCache()
    }
  })
})
