import { describe, expect, test } from 'bun:test'
import {
  matchesSkinFilter,
  uniqueSkinItemsByName
} from '../src/components/modals/SkinSelectModal/util'
import { ItemDto } from '../src/type/damage-skin'

const createItem = (name: string, id = 1): ItemDto => ({
  id,
  name,
  desc: '',
  isCash: false,
  requiredGender: 0,
  requiredJobs: [],
  requiredLevel: 0,
  typeInfo: {
    category: 'Unknown',
    highItemId: 0,
    lowItemId: 0,
    overallCategory: 'Unknown',
    subCategory: 'Unknown'
  }
})

describe('damage skin type filter', () => {
  test('액션 이름이 붙은 데미지 스킨만 액션 필터에 표시한다', () => {
    expect(
      matchesSkinFilter(createItem('NEW AGE 액션 데미지 스킨 (유닛)'), 'action')
    ).toBe(true)
    expect(
      matchesSkinFilter(createItem('키보드 워리어 데미지 스킨'), 'action')
    ).toBe(false)
  })

  test('유닛과 전체 필터는 기존 기준을 유지한다', () => {
    const item = createItem('삼원색 데미지 스킨 (유닛)')
    expect(matchesSkinFilter(item, 'unit')).toBe(true)
    expect(matchesSkinFilter(item, 'all')).toBe(true)
  })

  test('같은 이름의 매핑 아이템은 첫 항목 하나만 남긴다', () => {
    const items = [
      createItem('네온 액션 데미지 스킨 (유닛)', 2635781),
      createItem('네온 액션 데미지 스킨 (유닛)', 2635782),
      createItem('트로피 액션 데미지 스킨', 2635967)
    ]

    expect(uniqueSkinItemsByName(items).map((item) => item.id)).toEqual([
      2635781, 2635967
    ])
  })
})
