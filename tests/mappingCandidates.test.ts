import { describe, expect, test } from 'bun:test'
import { ItemDto } from '../src/type/damage-skin'
import {
  buildMappingCandidates,
  buildMappingVersionSet,
  getMappedSkinIndicesByName,
  getSelectableSkinIndices,
  getUnmappedVersionEntries,
  getVersionDelta,
  isDirectDamageSkinItem
} from '../src/pages/MappingTool/mappingCandidates'

const createItem = (id: number, name: string, desc: string): ItemDto => ({
  id,
  name,
  desc,
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

describe('damage skin mapping candidates', () => {
  test('버전 사이에 새로 추가된 값만 남긴다', () => {
    expect(getVersionDelta([1, 2, 3], [1, 2], (value) => value)).toEqual([3])
  })

  test('신규 인덱스가 없으면 현재 버전의 미매핑 인덱스만 선택지로 사용한다', () => {
    expect(
      getSelectableSkinIndices([], ['10', '2', '1', '2'], { 100: [2] })
    ).toEqual(['1', '10'])
    expect(
      getSelectableSkinIndices(['21', '20'], ['1', '2'], { 100: [20] })
    ).toEqual(['20', '21'])
  })

  test('선택권과 상자는 직접 적용형 아이템에서 제외한다', () => {
    expect(
      isDirectDamageSkinItem(
        createItem(
          1,
          '투명 데미지 스킨 (유닛)',
          '투명 데미지 스킨 (유닛)으로 변경한다.'
        )
      )
    ).toBe(true)
    expect(
      isDirectDamageSkinItem(
        createItem(2, '데미지 스킨 선택권', '데미지 스킨으로 변경한다.')
      )
    ).toBe(false)
  })

  test('동일 이름 아이템 여러 개와 신규 인덱스 하나를 높은 신뢰도로 묶는다', () => {
    const items = [
      createItem(
        2637518,
        '투명 데미지 스킨 (유닛)',
        '투명 데미지 스킨 (유닛)으로 변경한다.'
      ),
      createItem(
        2637519,
        '투명 데미지 스킨 (유닛)',
        '투명 데미지 스킨 (유닛)으로 변경한다.'
      )
    ]

    expect(buildMappingCandidates(items, ['355'], { '355': true })).toEqual([
      expect.objectContaining({
        itemIds: [2637518, 2637519],
        recommendedSkinIndex: '355',
        confidence: 'high',
        isUnitItem: true
      })
    ])
  })

  test('동일 이름의 기존 아이템 매핑을 새 아이템 ID에 자동 추천한다', () => {
    const mappedItem = createItem(
      2635127,
      '삼원색 데미지 스킨 (유닛)',
      '삼원색 데미지 스킨 (유닛)으로 변경한다.'
    )
    const duplicateItem = createItem(
      2635128,
      '삼원색  데미지 스킨 (유닛)',
      '삼원색 데미지 스킨 (유닛)으로 변경한다.'
    )
    const mappedByName = getMappedSkinIndicesByName(
      [mappedItem, duplicateItem],
      { 2635127: [318] }
    )

    expect(
      buildMappingCandidates([duplicateItem], [], {}, mappedByName)
    ).toEqual([
      expect.objectContaining({
        itemIds: [2635128],
        recommendedSkinIndex: '318',
        inheritedSkinIndices: ['318'],
        confidence: 'high'
      })
    ])
  })

  test('동일 이름 기존 매핑에 중복 인덱스가 여러 개면 모두 상속한다', () => {
    const mappedItem = createItem(
      100,
      '중복 데미지 스킨',
      '중복 데미지 스킨으로 변경한다.'
    )
    const duplicateItem = createItem(
      200,
      '중복 데미지 스킨',
      '중복 데미지 스킨으로 변경한다.'
    )

    const candidates = buildMappingCandidates(
      [duplicateItem],
      [],
      {},
      getMappedSkinIndicesByName([mappedItem, duplicateItem], {
        100: [10, 20]
      })
    )

    expect(candidates[0]).toMatchObject({
      recommendedSkinIndex: '10',
      inheritedSkinIndices: ['10', '20']
    })
  })

  test('여러 그룹과 여러 인덱스는 추가 순서대로 추천한다', () => {
    const items = [
      createItem(10, '가 데미지 스킨', '가 데미지 스킨으로 변경한다.'),
      createItem(20, '나 데미지 스킨', '나 데미지 스킨으로 변경한다.')
    ]

    const candidates = buildMappingCandidates(items, ['400', '401'], {})
    expect(
      candidates.map((candidate) => candidate.recommendedSkinIndex)
    ).toEqual(['400', '401'])
    expect(
      candidates.every((candidate) => candidate.confidence === 'medium')
    ).toBe(true)
  })

  test('같은 유형의 아이템 그룹이 여러 개면 하나의 인덱스를 중복 추천하지 않는다', () => {
    const items = [
      createItem(
        10,
        '가 데미지 스킨 (유닛)',
        '가 데미지 스킨 (유닛)으로 변경한다.'
      ),
      createItem(
        20,
        '나 데미지 스킨 (유닛)',
        '나 데미지 스킨 (유닛)으로 변경한다.'
      )
    ]

    const candidates = buildMappingCandidates(items, ['400'], { '400': true })
    expect(
      candidates.every(
        (candidate) =>
          candidate.recommendedSkinIndex === undefined &&
          candidate.confidence === 'manual'
      )
    ).toBe(true)
  })

  test('SkinMap에 반영된 아이템과 인덱스는 검수 대상에서 제외한다', () => {
    const mappedItem = createItem(
      100,
      '기존 데미지 스킨',
      '기존 데미지 스킨으로 변경한다.'
    )
    const newItem = createItem(
      200,
      '신규 데미지 스킨',
      '신규 데미지 스킨으로 변경한다.'
    )

    expect(
      getUnmappedVersionEntries([mappedItem, newItem], ['10', '20'], {
        100: [10]
      })
    ).toEqual({ items: [newItem], skinIndices: ['20'] })
  })

  test('인접 버전에서 실제 검수가 필요한 후보 수를 계산한다', () => {
    const existingItem = createItem(
      100,
      '기존 데미지 스킨',
      '기존 데미지 스킨으로 변경한다.'
    )
    const newItem = createItem(
      200,
      '신규 데미지 스킨',
      '신규 데미지 스킨으로 변경한다.'
    )

    expect(
      buildMappingVersionSet(
        { version: 356, items: [existingItem], skinIndices: ['10'] },
        {
          version: 357,
          items: [existingItem, newItem],
          skinIndices: ['10', '20']
        },
        { 100: [10] }
      )
    ).toEqual({
      baselineVersion: 356,
      reviewVersion: 357,
      itemCount: 1,
      skinIndexCount: 1,
      candidateCount: 1
    })
  })
})
