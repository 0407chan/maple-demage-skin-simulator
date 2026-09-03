import {
  keepPreviousData,
  useQuery,
  UseQueryResult
} from '@tanstack/react-query'
import axios from 'axios'
import { GetMapListQuery, MapleMap, MapleMapDetail } from 'type/map'
import { RegionType } from 'type/wz'

const API_BASE_URL = 'https://maplestory.io/api'
const MAX_MAP_DETAIL_CACHE_ENTRIES = 30
const mapDetailCache = new Map<string, Promise<MapleMapDetail>>()

export const getMapList = async (
  query: GetMapListQuery
): Promise<MapleMap[]> => {
  const { region, version, ...params } = query
  const result = await axios.get<MapleMap[]>(
    `${API_BASE_URL}/${region}/${version}/map`,
    { params, timeout: 12000 }
  )

  return result.data ?? []
}

export const useGetMapList = (
  query: GetMapListQuery,
  enabled = true
): UseQueryResult<MapleMap[], unknown> =>
  useQuery({
    queryKey: ['getMapList', query],
    queryFn: () => getMapList(query),
    placeholderData: keepPreviousData,
    enabled:
      enabled && query.version !== undefined && query.region !== undefined,
    staleTime: 1000 * 60 * 10
  })

export const getMapIconUrl = (
  mapId: number,
  version: number,
  region: RegionType
) => `${API_BASE_URL}/${region}/${version}/map/${mapId}/icon`

export const getMapDetail = (
  mapId: number,
  version: number,
  region: RegionType
) => {
  const cacheKey = `${region}/${version}/${mapId}`
  const cached = mapDetailCache.get(cacheKey)
  if (cached) {
    mapDetailCache.delete(cacheKey)
    mapDetailCache.set(cacheKey, cached)
    return cached
  }

  const request = axios
    .get<MapleMapDetail>(`${API_BASE_URL}/${region}/${version}/map/${mapId}`)
    .then((result) => result.data)
    .catch((error) => {
      mapDetailCache.delete(cacheKey)
      throw error
    })

  mapDetailCache.set(cacheKey, request)
  while (mapDetailCache.size > MAX_MAP_DETAIL_CACHE_ENTRIES) {
    const oldestKey = mapDetailCache.keys().next().value
    if (oldestKey === undefined) break
    mapDetailCache.delete(oldestKey)
  }

  return request
}

export const getMapRenderUrl = (
  mapId: number,
  version: number,
  region: RegionType
) =>
  `${API_BASE_URL}/${region}/${version}/map/${mapId}/render/0?showLife=false&showPortals=false&pixelAccess=1`
