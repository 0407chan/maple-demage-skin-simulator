import type { MapleMap } from 'type/map'
import { restoreBundledMap } from './bundledMaps'

export const restoreMapSelection = (value: unknown): MapleMap | undefined => {
  const bundled = restoreBundledMap(value)
  if (bundled) return bundled
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    typeof value.id !== 'number' ||
    !Number.isSafeInteger(value.id) ||
    value.id < 0 ||
    !('name' in value) ||
    typeof value.name !== 'string' ||
    !('streetName' in value) ||
    typeof value.streetName !== 'string'
  )
    return undefined
  return { id: value.id, name: value.name, streetName: value.streetName }
}

// Distinct map IDs can share a name; keep them all available for review.
export const mergeMapLists = (...lists: MapleMap[][]): MapleMap[] => {
  const maps = new Map<number, MapleMap>()
  for (const list of lists) {
    for (const map of list) {
      if (!maps.has(map.id)) maps.set(map.id, map)
    }
  }
  return [...maps.values()]
}
