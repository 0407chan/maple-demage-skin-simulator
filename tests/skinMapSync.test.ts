import { describe, expect, test } from 'bun:test'
import { SkinMapConflictError, updateSkinMapSource } from '../dev/skinMapSync'

const source = `export const SkinMap: Record<number, number[]> = {
  100: [1],
  200: [2, 3]
}
`

describe('SkinMap source sync', () => {
  test('새 매핑을 정렬해 객체 끝에 추가한다', () => {
    const result = updateSkinMapSource(source, [
      { itemId: 400, skinIndices: [5] },
      { itemId: 300, skinIndices: [4] }
    ])

    expect(result.addedItemIds).toEqual([300, 400])
    expect(result.unchangedItemIds).toEqual([])
    expect(result.source).toContain(
      '  200: [2, 3],\n  300: [4],\n  400: [5],\n}'
    )
  })

  test('이미 같은 매핑은 파일을 바꾸지 않는다', () => {
    const result = updateSkinMapSource(source, [
      { itemId: 200, skinIndices: [2, 3] }
    ])

    expect(result.source).toBe(source)
    expect(result.addedItemIds).toEqual([])
    expect(result.unchangedItemIds).toEqual([200])
  })

  test('기존 매핑이 다르면 덮어쓰지 않는다', () => {
    expect(() =>
      updateSkinMapSource(source, [{ itemId: 100, skinIndices: [9] }])
    ).toThrow(SkinMapConflictError)
  })

  test('기존 대표 인덱스를 유지하면서 중복 인덱스를 병합한다', () => {
    const result = updateSkinMapSource(source, [
      { itemId: 100, skinIndices: [1, 4, 5] }
    ])

    expect(result.addedItemIds).toEqual([])
    expect(result.updatedItemIds).toEqual([100])
    expect(result.source).toContain('  100: [1, 4, 5],')
  })

  test('기존 대표 인덱스를 바꾸거나 제거하는 병합은 거부한다', () => {
    expect(() =>
      updateSkinMapSource(source, [{ itemId: 200, skinIndices: [3, 4] }])
    ).toThrow(SkinMapConflictError)
  })
})
