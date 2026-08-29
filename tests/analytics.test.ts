import { describe, expect, test } from 'bun:test'
import {
  ANALYTICS_EVENT_NAMES,
  getChangedSettingFields,
  getSkinAnalyticsType
} from '../src/utils/analytics'
import { ItemDto } from '../src/type/damage-skin'

const createSkin = (name: string): ItemDto => ({
  id: 1,
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

describe('GA4 이벤트 체계', () => {
  test('모든 맞춤 이벤트는 한국어 이름과 GA4 이름 규칙을 사용한다', () => {
    Object.values(ANALYTICS_EVENT_NAMES).forEach((eventName) => {
      expect(eventName).toMatch(/^\p{L}[\p{L}\p{N}_]*$/u)
      expect(Array.from(eventName).length).toBeLessThanOrEqual(40)
      expect(eventName).toMatch(/[\uAC00-\uD7A3]/)
    })
  })

  test('스킨 이름을 리포트용 유형으로 분류한다', () => {
    expect(
      getSkinAnalyticsType(createSkin('NEW AGE 액션 데미지 스킨 (유닛)'))
    ).toBe('액션')
    expect(getSkinAnalyticsType(createSkin('삼원색 데미지 스킨 (유닛)'))).toBe(
      '유닛'
    )
    expect(getSkinAnalyticsType(createSkin('투명 데미지 스킨'))).toBe('일반')
  })

  test('설정을 닫을 때 실제로 변경된 항목만 선별한다', () => {
    expect(
      getChangedSettingFields(
        {
          minDamage: 100,
          maxDamage: 1000,
          criticalRate: 60,
          numberAttack: 5,
          monsterInvincible: true
        },
        {
          minDamage: 200,
          maxDamage: 1000,
          criticalRate: 70,
          numberAttack: 5,
          monsterInvincible: false
        }
      )
    ).toEqual(['최소_데미지', '크리티컬_확률', '몬스터_무적_모드'])
  })
})
