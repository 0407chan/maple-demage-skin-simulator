export type SkinMapSyncEntry = {
  itemId: number
  skinIndices: number[]
}

export type SkinMapSyncResult = {
  source: string
  addedItemIds: number[]
  updatedItemIds: number[]
  unchangedItemIds: number[]
}

export class SkinMapConflictError extends Error {
  constructor(
    public readonly itemId: number,
    public readonly existingSkinIndices: number[],
    public readonly requestedSkinIndices: number[]
  ) {
    super(
      `아이템 ${itemId}은 이미 [${existingSkinIndices.join(', ')}]에 매핑되어 있어 [${requestedSkinIndices.join(', ')}]로 덮어쓸 수 없습니다.`
    )
    this.name = 'SkinMapConflictError'
  }
}

const SKIN_MAP_DECLARATION =
  'export const SkinMap: Record<number, number[]> = {'
const ENTRY_PATTERN = /^([ \t]*)(\d+):\s*\[([\d,\s]+)\](,?)[ \t]*$/gm

const isSameIndices = (left: number[], right: number[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index])

const validateEntry = (entry: SkinMapSyncEntry) => {
  if (!Number.isSafeInteger(entry.itemId) || entry.itemId <= 0) {
    throw new Error('아이템 ID는 양의 정수여야 합니다.')
  }
  if (
    entry.skinIndices.length === 0 ||
    entry.skinIndices.some(
      (skinIndex) => !Number.isSafeInteger(skinIndex) || skinIndex < 0
    )
  ) {
    throw new Error('스킨 인덱스는 0 이상의 정수 배열이어야 합니다.')
  }
}

const parseEntries = (body: string) => {
  const entries = new Map<number, number[]>()

  for (const match of body.matchAll(ENTRY_PATTERN)) {
    entries.set(
      Number(match[2]),
      match[3].split(',').map((value) => Number(value.trim()))
    )
  }

  return entries
}

export const updateSkinMapSource = (
  source: string,
  requestedEntries: SkinMapSyncEntry[]
): SkinMapSyncResult => {
  const declarationIndex = source.indexOf(SKIN_MAP_DECLARATION)
  if (declarationIndex < 0) {
    throw new Error('SkinMap 선언을 찾지 못했습니다.')
  }

  const bodyStart = source.indexOf('{', declarationIndex) + 1
  const bodyEnd = source.lastIndexOf('}')
  if (bodyStart === 0 || bodyEnd < bodyStart) {
    throw new Error('SkinMap 객체 범위를 찾지 못했습니다.')
  }

  const normalizedRequests = new Map<number, number[]>()
  requestedEntries.forEach((entry) => {
    validateEntry(entry)
    const previous = normalizedRequests.get(entry.itemId)
    if (previous && !isSameIndices(previous, entry.skinIndices)) {
      throw new Error(`아이템 ${entry.itemId}의 요청 값이 서로 다릅니다.`)
    }
    normalizedRequests.set(entry.itemId, entry.skinIndices)
  })

  const objectBody = source.slice(bodyStart, bodyEnd)
  const existingEntries = parseEntries(objectBody)
  const additions: SkinMapSyncEntry[] = []
  const updates = new Map<number, number[]>()
  const unchangedItemIds: number[] = []

  normalizedRequests.forEach((skinIndices, itemId) => {
    const existing = existingEntries.get(itemId)
    if (!existing) {
      additions.push({ itemId, skinIndices })
      return
    }
    if (isSameIndices(existing, skinIndices)) {
      unchangedItemIds.push(itemId)
      return
    }

    const preservesExistingMapping =
      skinIndices[0] === existing[0] &&
      existing.every((skinIndex) => skinIndices.includes(skinIndex))
    if (!preservesExistingMapping) {
      throw new SkinMapConflictError(itemId, existing, skinIndices)
    }
    updates.set(itemId, skinIndices)
  })

  additions.sort((left, right) => left.itemId - right.itemId)
  const updatedItemIds = [...updates.keys()].sort((left, right) => left - right)
  unchangedItemIds.sort((left, right) => left - right)
  if (additions.length === 0 && updates.size === 0) {
    return {
      source,
      addedItemIds: [],
      updatedItemIds: [],
      unchangedItemIds
    }
  }

  const updatedBody = objectBody.replace(
    ENTRY_PATTERN,
    (entry, indentation, itemIdValue, _indices, comma) => {
      const itemId = Number(itemIdValue)
      const skinIndices = updates.get(itemId)
      if (!skinIndices) return entry
      return `${indentation}${itemId}: [${skinIndices.join(', ')}]${comma}`
    }
  )
  const trimmedBody = updatedBody.trimEnd()
  const separator =
    trimmedBody.length === 0 ? '\n' : trimmedBody.endsWith(',') ? '\n' : ',\n'
  const appendedEntries = additions
    .map(
      ({ itemId, skinIndices }) => `  ${itemId}: [${skinIndices.join(', ')}],`
    )
    .join('\n')
  const nextBody = `${trimmedBody}${separator}${appendedEntries}\n`

  return {
    source: `${source.slice(0, bodyStart)}${nextBody}${source.slice(bodyEnd)}`,
    addedItemIds: additions.map(({ itemId }) => itemId),
    updatedItemIds,
    unchangedItemIds
  }
}
