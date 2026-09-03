import {
  keepPreviousData,
  useQuery,
  UseQueryResult
} from '@tanstack/react-query'
import axios from 'axios'
import { GetMonsterListQuery, Monster, MonsterDetail } from 'type/monster'
import { RegionType } from 'type/wz'

const API_BASE_URL = 'https://maplestory.io/api'

export const getMonsterList = async (
  query: GetMonsterListQuery
): Promise<Monster[]> => {
  const { region, version, ...params } = query
  const result = await axios.get<Monster[]>(
    `${API_BASE_URL}/${region}/${version}/mob`,
    { params, timeout: 12000 }
  )

  return result.data ?? []
}

export const useGetMonsterList = (
  query: GetMonsterListQuery,
  enabled = true
): UseQueryResult<Monster[], unknown> =>
  useQuery({
    queryKey: ['getMonsterList', query],
    queryFn: () => getMonsterList(query),
    placeholderData: keepPreviousData,
    enabled:
      enabled && query.version !== undefined && query.region !== undefined,
    staleTime: 1000 * 60 * 10
  })

export const getMonsterDetail = async (
  monsterId: number,
  version: number,
  region: RegionType
): Promise<MonsterDetail> => {
  const result = await axios.get<MonsterDetail>(
    `${API_BASE_URL}/${region}/${version}/mob/${monsterId}`,
    { timeout: 12000 }
  )

  return result.data
}

export const getMonsterDetailQueryKey = (
  monsterId: number,
  version: number,
  region: RegionType
) => ['getMonsterDetail', region, version, monsterId] as const

export const useGetMonsterDetail = (
  monsterId?: number,
  version?: number,
  region?: RegionType
): UseQueryResult<MonsterDetail, unknown> =>
  useQuery({
    queryKey:
      monsterId !== undefined && version !== undefined && region !== undefined
        ? getMonsterDetailQueryKey(monsterId, version, region)
        : ['getMonsterDetail', region, version, monsterId],
    queryFn: () => getMonsterDetail(monsterId!, version!, region!),
    enabled:
      monsterId !== undefined && version !== undefined && region !== undefined,
    staleTime: 1000 * 60 * 60
  })

export const getMonsterIconUrl = (
  monsterId: number,
  version: number,
  region: RegionType
) => `${API_BASE_URL}/${region}/${version}/mob/${monsterId}/icon`

export const getMonsterAnimationUrl = (
  monsterId: number,
  animation: string,
  version: number,
  region: RegionType
) =>
  `${API_BASE_URL}/${region}/${version}/mob/${monsterId}/render/${encodeURIComponent(animation)}?cors=1`
