import type { Monster } from 'type/monster'
import type { Setting } from 'type/setting'

const NORMAL_MONSTER_ATTACKS_TO_DEFEAT = 5
const BOSS_MONSTER_ATTACKS_TO_DEFEAT = 10

type MonsterHealthOptions = Pick<Monster, 'isBoss'> & Setting

export const getMonsterMaxHealth = ({
  isBoss,
  maxDamage,
  minDamage,
  numberAttack
}: MonsterHealthOptions) => {
  const safeMinDamage = Math.max(1, minDamage ?? 1)
  const safeMaxDamage = Math.max(safeMinDamage, maxDamage ?? safeMinDamage)
  const averageDamage = (safeMinDamage + safeMaxDamage) / 2
  const attacksToDefeat = isBoss
    ? BOSS_MONSTER_ATTACKS_TO_DEFEAT
    : NORMAL_MONSTER_ATTACKS_TO_DEFEAT

  return Math.max(
    1,
    Math.round(averageDamage * Math.max(1, numberAttack ?? 1) * attacksToDefeat)
  )
}

export const getMonsterHealthPercent = (
  currentHealth: number,
  maxHealth: number
) => Math.min(100, Math.max(0, (currentHealth / Math.max(1, maxHealth)) * 100))
