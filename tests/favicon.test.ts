import { describe, expect, test } from 'bun:test'
import { getDamageSkinFaviconUrl } from '../src/utils/favicon'

describe('damage skin favicon', () => {
  test('현재 WZ 버전과 선택한 스킨 아이템으로 아이콘 URL을 만든다', () => {
    expect(getDamageSkinFaviconUrl(2431965, 389, 'KMS')).toBe(
      'https://maplestory.io/api/KMS/389/item/2431965/icon'
    )
  })
})
