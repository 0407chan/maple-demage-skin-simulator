import { describe, expect, test } from 'bun:test'
import {
  getMonsterHealthAfterAttack,
  getMonsterHealthPercent,
  getMonsterMaxHealth
} from '../src/utils/monsterHealth'
import { DEFAULT_SETTINGS } from '../src/constants/app_constants'

describe('monster health', () => {
  const setting = {
    numberAttack: 5,
    minDamage: 100_000,
    maxDamage: 1_000_000,
    criticalRate: 60
  }

  test('일반 몬스터는 평균 5회, 보스는 평균 10회 공격량을 체력으로 사용한다', () => {
    const normalHealth = getMonsterMaxHealth({ ...setting, isBoss: false })
    const bossHealth = getMonsterMaxHealth({ ...setting, isBoss: true })

    expect(normalHealth).toBe(13_750_000)
    expect(bossHealth).toBe(27_500_000)
  })

  test('체력 비율은 0%와 100% 사이로 제한한다', () => {
    expect(getMonsterHealthPercent(25, 100)).toBe(25)
    expect(getMonsterHealthPercent(-10, 100)).toBe(0)
    expect(getMonsterHealthPercent(120, 100)).toBe(100)
  })

  test('무적모드는 기본으로 켜지고 공격을 받아도 체력이 줄지 않는다', () => {
    expect(DEFAULT_SETTINGS.MONSTER_INVINCIBLE).toBe(true)
    expect(getMonsterHealthAfterAttack(100, 80, true)).toBe(100)
    expect(getMonsterHealthAfterAttack(100, 80, false)).toBe(20)
    expect(getMonsterHealthAfterAttack(100, 120, false)).toBe(0)
  })
})
