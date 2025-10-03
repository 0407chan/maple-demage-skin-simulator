const UNIT_SIZE = 10000 // 만 단위
const EOK_SIZE = 100000000 // 억 단위

/**
 * 숫자를 억, 만, 일 단위로 파싱
 */
const parseUnits = (damage: number) => {
  const eok = Math.floor(damage / EOK_SIZE)
  const man = Math.floor((damage % EOK_SIZE) / UNIT_SIZE)
  const il = damage % UNIT_SIZE

  return { eok, man, il }
}

/**
 * 데미지 값을 포맷팅하는 함수
 * @param damage - 데미지 값
 * @param isUnit - 유닛 표시 여부 (억, 만 단위 사용)
 * @returns 포맷팅된 데미지 문자열
 */
export const formatDamageString = (damage: number, isUnit: boolean): string => {
  if (!isUnit) {
    return `${damage}`
  }

  const { eok, man, il } = parseUnits(damage)
  const parts: string[] = []

  if (eok > 0) parts.push(`${eok}억`)
  if (man > 0) parts.push(`${man}만`)
  if (il > 0 || parts.length === 0) parts.push(`${il}`)

  return parts.join('')
}
