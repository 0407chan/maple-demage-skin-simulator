import { describe, expect, test } from 'bun:test'
import {
  getMonsterAnimationsToPreload,
  getPrimaryMonsterAnimation
} from '../src/utils/monsterAnimation'

describe('monster animation selection', () => {
  const framebooks = {
    die1: 4,
    hit1: 1,
    move: 3,
    stand: 2
  }

  test('화면에 표시할 대기와 피격 애니메이션을 선택한다', () => {
    expect(getPrimaryMonsterAnimation(framebooks, 'idle')).toBe('stand')
    expect(getPrimaryMonsterAnimation(framebooks, 'hit')).toBe('hit1')
  })

  test('몬스터 선택 시 대기, 걷기, 피격 이미지를 모두 미리 불러온다', () => {
    expect(getMonsterAnimationsToPreload(framebooks)).toEqual([
      'stand',
      'move',
      'hit1'
    ])
  })

  test('몬스터에 실제로 없는 애니메이션은 제외한다', () => {
    expect(getMonsterAnimationsToPreload({ stand: 1, hit1: 0 })).toEqual([
      'stand'
    ])
  })
})
