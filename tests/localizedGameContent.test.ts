import { describe, expect, test } from 'bun:test'
import {
  getLocalizedContentRegion,
  getLocalizedContentVersion
} from '../src/i18n/gameContent'
import { WzType } from '../src/type/wz'

const versions: WzType[] = [
  { region: 'KMS', mapleVersionId: '389', isReady: true, hasImages: true },
  { region: 'GMS', mapleVersionId: '267', isReady: true, hasImages: true },
  { region: 'GMS', mapleVersionId: '268', isReady: true, hasImages: true },
  { region: 'JMS', mapleVersionId: '422', isReady: true, hasImages: true },
  { region: 'CMS', mapleVersionId: '202', isReady: true, hasImages: true },
  { region: 'TWMS', mapleVersionId: '256', isReady: true, hasImages: true }
]

describe('localized game content', () => {
  test('UI 언어를 같은 지역의 몬스터·맵 이름 데이터로 연결한다', () => {
    expect(getLocalizedContentRegion('ko')).toBe('KMS')
    expect(getLocalizedContentRegion('en')).toBe('GMS')
    expect(getLocalizedContentRegion('ja')).toBe('JMS')
    expect(getLocalizedContentRegion('zh-CN')).toBe('CMS')
    expect(getLocalizedContentRegion('zh-TW')).toBe('TWMS')
  })

  test('지역별 최신 준비 버전을 독립적으로 고른다', () => {
    expect(getLocalizedContentVersion(versions, 'en')).toBe(268)
    expect(getLocalizedContentVersion(versions, 'zh-TW')).toBe(256)
    expect(getLocalizedContentVersion(undefined, 'ko')).toBeUndefined()
  })
})
