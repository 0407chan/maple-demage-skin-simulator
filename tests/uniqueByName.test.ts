import { describe, expect, test } from 'bun:test'
import { getUniqueByName } from '../src/utils/uniqueByName'

describe('unique by name', () => {
  test('같은 이름의 항목은 첫 번째 항목만 남긴다', () => {
    const items = [
      { id: 1, name: '레헬른' },
      { id: 2, name: '레헬른' },
      { id: 3, name: '헤네시스' }
    ]

    expect(getUniqueByName(items)).toEqual([items[0], items[2]])
  })

  test('이름 앞뒤 공백이 달라도 중복으로 처리한다', () => {
    const items = [
      { id: 1, name: '주황버섯' },
      { id: 2, name: ' 주황버섯 ' }
    ]

    expect(getUniqueByName(items)).toEqual([items[0]])
  })
})
