import manifestJson from 'generated/mapManifest.json'
import type { Locale } from 'i18n'
import type { MapleMap, MapleMapDetail } from 'type/map'
import type { MapBackgroundLayer, MapGroundMetrics } from './mapScene'

type BundledMap = MapleMap & {
  labels: Record<Locale, { name: string; streetName: string }>
  foregroundPath: string
  iconPath: string
  backgroundColor: string
  detail: MapleMapDetail
  groundMetrics: MapGroundMetrics
  backgrounds: MapBackgroundLayer[]
  placement?: { coordinateSystem: string; anchor: string; x: number; y: number }
  source?: { region: string; wzVersion: number }
}

const maps: BundledMap[] = manifestJson.maps

// Vite's deployment base includes the repository path on GitHub Pages.
export const getMapAssetUrl = (path: string) =>
  `${import.meta.env?.BASE_URL ?? '/'}${path}`

export const getBundledMap = (mapId: number) =>
  maps.find((map) => map.id === mapId)

export const getBundledMapList = (locale: Locale, search = ''): MapleMap[] => {
  const query = search.trim().toLocaleLowerCase()
  return maps
    .filter((map) =>
      [
        String(map.id),
        ...Object.values(map.labels).flatMap((label) => [
          label.name,
          label.streetName
        ])
      ].some((label) => label.toLocaleLowerCase().includes(query))
    )
    .map((map) => ({ id: map.id, ...map.labels[locale] }))
}

export const getBundledMapIconUrl = (mapId: number) => {
  const map = getBundledMap(mapId)
  return map ? getMapAssetUrl(map.iconPath) : undefined
}

export const restoreBundledMap = (value: unknown): MapleMap | undefined => {
  if (typeof value !== 'object' || value === null || !('id' in value)) {
    return undefined
  }
  const map = typeof value.id === 'number' ? getBundledMap(value.id) : undefined
  return map
    ? { id: map.id, name: map.name, streetName: map.streetName }
    : undefined
}

export const getBundledMapScene = (mapId: number) => {
  const map = getBundledMap(mapId)
  if (!map) return undefined

  return {
    mapId: map.id,
    source: map.source ?? {
      region: manifestJson.region,
      wzVersion: manifestJson.wzVersion
    },
    placement: map.placement,
    backgroundColor: map.backgroundColor,
    foregroundUrl: getMapAssetUrl(map.foregroundPath),
    groundMetrics: map.groundMetrics,
    mapDetail: map.detail,
    backgrounds: map.backgrounds.map((background) => ({
      ...background,
      imagePath: getMapAssetUrl(background.imagePath),
      sequence: {
        ...background.sequence,
        frames: background.sequence.frames.map((frame) => ({
          ...frame,
          src: getMapAssetUrl(frame.src)
        }))
      }
    }))
  }
}
