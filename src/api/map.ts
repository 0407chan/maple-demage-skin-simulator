import {
  keepPreviousData,
  useQuery,
  UseQueryResult
} from '@tanstack/react-query'
import axios from 'axios'
import { GetMapListQuery, MapleMap } from 'type/map'
import { RegionType } from 'type/wz'

const API_BASE_URL = 'https://maplestory.io/api'

export const getMapList = async (
  query: GetMapListQuery
): Promise<MapleMap[]> => {
  const { region, version, ...params } = query
  const result = await axios.get<MapleMap[]>(
    `${API_BASE_URL}/${region}/${version}/map`,
    { params }
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

export const getMapRenderUrl = (
  mapId: number,
  version: number,
  region: RegionType
) =>
  `${API_BASE_URL}/${region}/${version}/map/${mapId}/render/0?showLife=false&showPortals=false&pixelAccess=1`
