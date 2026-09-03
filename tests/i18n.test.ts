import { describe, expect, test } from 'bun:test'
import { isLocalePreference, resolveSupportedLocale } from '../src/i18n'

describe('locale selection', () => {
  test('한국어, 영어, 일본어, 중국어 브라우저 언어를 지원 언어로 연결한다', () => {
    expect(resolveSupportedLocale(['ko-KR'])).toBe('ko')
    expect(resolveSupportedLocale(['en-US'])).toBe('en')
    expect(resolveSupportedLocale(['ja-JP'])).toBe('ja')
    expect(resolveSupportedLocale(['zh-CN'])).toBe('zh-CN')
    expect(resolveSupportedLocale(['zh-TW'])).toBe('zh-CN')
  })

  test('첫 번째 언어를 지원하지 않으면 다음 브라우저 선호 언어를 사용한다', () => {
    expect(resolveSupportedLocale(['fr-FR', 'ja-JP', 'en-US'])).toBe('ja')
  })

  test('지원 언어가 없으면 영어를 사용한다', () => {
    expect(resolveSupportedLocale(['fr-FR', 'de-DE'])).toBe('en')
    expect(resolveSupportedLocale([])).toBe('en')
  })

  test('저장 가능한 자동 및 직접 선택 값만 허용한다', () => {
    expect(isLocalePreference('auto')).toBe(true)
    expect(isLocalePreference('ko')).toBe(true)
    expect(isLocalePreference('en')).toBe(true)
    expect(isLocalePreference('ja')).toBe(true)
    expect(isLocalePreference('zh-CN')).toBe(true)
    expect(isLocalePreference('fr')).toBe(false)
    expect(isLocalePreference(null)).toBe(false)
  })
})
