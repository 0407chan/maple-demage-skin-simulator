import { ItemDto } from 'type/damage-skin'

export type MappingConfidence = 'high' | 'medium' | 'manual'

export type MappingCandidate = {
  id: string
  itemIds: number[]
  itemName: string
  recommendedSkinIndex?: string
  inheritedSkinIndices?: string[]
  confidence: MappingConfidence
  reasons: string[]
  isUnitItem: boolean
}

const EXCLUDED_NAME_PARTS = [
  '상자',
  '선택권',
  '저장 스크롤',
  '추출권',
  '슬롯 확장권',
  '1칸 확장권'
]

export const isDirectDamageSkinItem = (item: ItemDto) => {
  if (!item.name.includes('데미지 스킨')) return false
  if (EXCLUDED_NAME_PARTS.some((part) => item.name.includes(part))) return false

  return (
    (item.desc.includes('데미지 스킨') && item.desc.includes('으로 변경')) ||
    item.desc.includes('사용하지 않은 상태로 되돌린다')
  )
}

export const normalizeDamageSkinName = (name: string) =>
  name.trim().replace(/\s+/g, ' ')

const groupItemsByName = (items: ItemDto[]) => {
  const groups = new Map<string, ItemDto[]>()

  items.forEach((item) => {
    const normalizedName = normalizeDamageSkinName(item.name)
    const group = groups.get(normalizedName) ?? []
    group.push(item)
    groups.set(normalizedName, group)
  })

  return [...groups.entries()]
    .map(([itemName, groupedItems]) => ({
      itemName,
      items: groupedItems.sort((a, b) => a.id - b.id),
      isUnitItem: itemName.includes('유닛')
    }))
    .sort((a, b) => a.items[0].id - b.items[0].id)
}

const isSameIndices = (left: number[], right: number[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index])

export const getMappedSkinIndicesByName = (
  items: ItemDto[],
  skinMap: Record<number, number[]>
) => {
  const mappings = new Map<string, number[]>()
  const conflicts = new Set<string>()

  items.forEach((item) => {
    const skinIndices = skinMap[item.id]
    if (!skinIndices) return

    const normalizedName = normalizeDamageSkinName(item.name)
    const existing = mappings.get(normalizedName)
    if (existing && !isSameIndices(existing, skinIndices)) {
      conflicts.add(normalizedName)
      mappings.delete(normalizedName)
      return
    }
    if (!conflicts.has(normalizedName)) {
      mappings.set(normalizedName, skinIndices)
    }
  })

  return Object.fromEntries(mappings) as Record<string, number[]>
}

export const buildMappingCandidates = (
  newItems: ItemDto[],
  newSkinIndices: string[],
  unitStatus: Record<string, boolean | undefined>,
  mappedSkinIndicesByName: Record<string, number[]> = {}
): MappingCandidate[] => {
  const itemGroups = groupItemsByName(newItems.filter(isDirectDamageSkinItem))
  const sortedSkinIndices = [...newSkinIndices].sort(
    (a, b) => Number(a) - Number(b)
  )

  return itemGroups.map((group, groupIndex) => {
    const unitCompatibleIndices = sortedSkinIndices.filter(
      (skinIndex) => unitStatus[skinIndex] === group.isUnitItem
    )
    const unitCompatibleGroupCount = itemGroups.filter(
      (itemGroup) => itemGroup.isUnitItem === group.isUnitItem
    ).length
    const reasons = ['같은 버전에서 새로 추가됨']
    let recommendedSkinIndex: string | undefined
    let inheritedSkinIndices: string[] | undefined
    let confidence: MappingConfidence = 'manual'
    const existingNameMapping = mappedSkinIndicesByName[group.itemName]

    if (existingNameMapping?.length) {
      inheritedSkinIndices = existingNameMapping.map(String)
      recommendedSkinIndex = inheritedSkinIndices[0]
      confidence = 'high'
      reasons.push(
        `동일 이름 기존 아이템의 INDEX ${inheritedSkinIndices.join(', ')} 매핑 재사용`
      )
    } else if (itemGroups.length === 1 && sortedSkinIndices.length === 1) {
      recommendedSkinIndex = sortedSkinIndices[0]
      confidence = 'high'
      reasons.push('신규 아이템 이름 그룹과 신규 인덱스가 각각 1개')
    } else if (
      unitCompatibleIndices.length === 1 &&
      unitCompatibleGroupCount === 1
    ) {
      recommendedSkinIndex = unitCompatibleIndices[0]
      confidence = 'high'
      reasons.push('유닛 여부가 일치하는 인덱스가 1개')
    } else if (itemGroups.length === sortedSkinIndices.length) {
      recommendedSkinIndex = sortedSkinIndices[groupIndex]
      confidence = 'medium'
      reasons.push('아이템 그룹과 인덱스를 추가 순서대로 연결')
    }

    if (
      recommendedSkinIndex &&
      unitStatus[recommendedSkinIndex] === group.isUnitItem
    ) {
      reasons.push(group.isUnitItem ? '유닛 구조 일치' : '일반 스킨 구조 일치')
    }

    return {
      id: `${group.items.map((item) => item.id).join('-')}:${group.itemName}`,
      itemIds: group.items.map((item) => item.id),
      itemName: group.itemName,
      recommendedSkinIndex,
      inheritedSkinIndices,
      confidence,
      reasons,
      isUnitItem: group.isUnitItem
    }
  })
}

export const getVersionDelta = <T, K extends string | number>(
  current: T[],
  baseline: T[],
  getKey: (item: T) => K
) => {
  const baselineKeys = new Set(baseline.map(getKey))
  return current.filter((item) => !baselineKeys.has(getKey(item)))
}

export const getSelectableSkinIndices = (
  newSkinIndices: string[],
  currentSkinIndices: string[],
  skinMap: Record<number, number[]>
) => {
  const mappedSkinIndices = new Set(Object.values(skinMap).flat())
  const selectableIndices =
    newSkinIndices.length > 0
      ? newSkinIndices
      : currentSkinIndices.filter(
          (skinIndex) => !mappedSkinIndices.has(Number(skinIndex))
        )

  return [...new Set(selectableIndices)]
    .filter((skinIndex) => /^\d+$/.test(skinIndex))
    .sort((a, b) => Number(a) - Number(b))
}

export const getUnmappedVersionEntries = (
  newItems: ItemDto[],
  newSkinIndices: string[],
  skinMap: Record<number, number[]>
) => {
  const mappedSkinIndices = new Set(Object.values(skinMap).flat())

  return {
    items: newItems.filter((item) => skinMap[item.id] === undefined),
    skinIndices: newSkinIndices.filter(
      (skinIndex) => !mappedSkinIndices.has(Number(skinIndex))
    )
  }
}

export type MappingVersionSnapshot = {
  version: number
  items: ItemDto[]
  skinIndices: string[]
}

export type MappingVersionSet = {
  baselineVersion: number
  reviewVersion: number
  itemCount: number
  skinIndexCount: number
  candidateCount: number
}

export const buildMappingVersionSet = (
  baseline: MappingVersionSnapshot,
  review: MappingVersionSnapshot,
  skinMap: Record<number, number[]>
): MappingVersionSet => {
  const versionNewItems = getVersionDelta(
    review.items,
    baseline.items,
    (item) => item.id
  )
  const versionNewSkinIndices = getVersionDelta(
    review.skinIndices,
    baseline.skinIndices,
    (skinIndex) => skinIndex
  )
  const unmapped = getUnmappedVersionEntries(
    versionNewItems,
    versionNewSkinIndices,
    skinMap
  )
  const mappedSkinIndicesByName = getMappedSkinIndicesByName(
    review.items,
    skinMap
  )

  return {
    baselineVersion: baseline.version,
    reviewVersion: review.version,
    itemCount: unmapped.items.length,
    skinIndexCount: unmapped.skinIndices.length,
    candidateCount: buildMappingCandidates(
      unmapped.items,
      unmapped.skinIndices,
      {},
      mappedSkinIndicesByName
    ).length
  }
}
