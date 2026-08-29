import { describe, expect, test } from 'bun:test'
import {
  getDamageAnchorTop,
  getDamageSpawnBottom
} from '../src/utils/damageSpawn'

describe('damage spawn position', () => {
  test('몬스터 이미지 상단보다 12px 위에서 데미지를 시작한다', () => {
    expect(getDamageSpawnBottom({ viewportHeight: 900, monsterTop: 464 })).toBe(
      448
    )
  })

  test('큰 몬스터일수록 데미지 시작점을 더 위로 올린다', () => {
    const smallMonsterSpawn = getDamageSpawnBottom({
      viewportHeight: 900,
      monsterTop: 600
    })
    const largeMonsterSpawn = getDamageSpawnBottom({
      viewportHeight: 900,
      monsterTop: 320
    })

    expect(largeMonsterSpawn).toBeGreaterThan(smallMonsterSpawn)
  })

  test('연속 공격 중 피격 이미지 높이가 달라져도 대기 모션 기준점을 유지한다', () => {
    const idleTop = getDamageAnchorTop({
      monsterAnchorBottom: 624,
      currentMonsterTop: 585
    })
    const hitTop = getDamageAnchorTop({
      monsterAnchorBottom: 624,
      currentMonsterTop: 240,
      idleMonsterTopOffset: 39
    })

    expect(idleTop).toBe(585)
    expect(hitTop).toBe(idleTop)
  })

  test('이미지가 화면보다 커도 데미지가 상단 밖으로 벗어나지 않는다', () => {
    expect(getDamageSpawnBottom({ viewportHeight: 900, monsterTop: -40 })).toBe(
      876
    )
  })
})
