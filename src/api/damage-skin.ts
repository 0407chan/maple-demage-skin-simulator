import {
  useQuery,
  UseQueryOptions,
  UseQueryResult
} from '@tanstack/react-query'
import axios from 'axios'
import {
  GetDamageSkinResponse,
  GetItemListQuery,
  ItemDto
} from 'type/damage-skin'
import { WzType } from 'type/wz'

// export const getDamageSkin = async (
//   query: GetDamageSkinQuery
// ): Promise<GetDamageSkinResponse> => {
//   const result = await axios.get(
//     `https://maplestory.io/api/wz/KMS/${query.version}/Effect/DamageSkin.img/${query.skinNumber}/${query.skinType}/${query.damageNumber}`
//   )
//   return result.data
// }

// export const useGetDamageSkin = (
//   query: GetDamageSkinQuery
// ): UseQueryResult<GetDamageSkinResponse, unknown> => {
//   return useQuery(
//     ['getDamageSkin', query],
//     async () => {
//       return getDamageSkin(query)
//     },
//     {
//       enabled: query.skinNumber !== undefined,
//       retry: false,
//       keepPreviousData: false,
//       staleTime: 1000 * 60 * 60,
//       refetchOnWindowFocus: false
//     }
//   )
// }

export const getDamageSkinAll = async (
  version: number
): Promise<GetDamageSkinResponse> => {
  const result = await axios.get(
    `https://maplestory.io/api/wz/KMS/${version}/Effect/DamageSkin.img`
  )
  return result.data
}

export const useGetDamageSkinAll = (
  version: number
): UseQueryResult<GetDamageSkinResponse, unknown> => {
  return useQuery(['getDamageSkinAll', version], async () => {
    return getDamageSkinAll(version)
  })
}

export const getItemList = async (
  query: GetItemListQuery
): Promise<ItemDto[]> => {
  const result = await axios.get(
    `https://maplestory.io/api/KMS/${query.version}/item`,
    {
      params: query
    }
  )
  return result.data
}

export const useGetItemList = (
  query: GetItemListQuery
): UseQueryResult<ItemDto[], unknown> => {
  return useQuery(
    ['getItemList', query],
    async () => {
      return getItemList(query)
    },
    { retry: false, refetchOnWindowFocus: false, keepPreviousData: true }
  )
}
export const getWzVersion = async (): Promise<WzType[]> => {
  const result = await axios.get('https://maplestory.io/api/wz')
  return result.data
}

export const useGetWzVersion = ({
  options
}: {
  options?: UseQueryOptions<WzType[], unknown, WzType[], string[]>
}): UseQueryResult<WzType[], unknown> => {
  return useQuery(['getWzVersion'], getWzVersion, options)
}

// export const useGetItemList = (
//   query?: GetItemListQuery
// ): UseQueryResult<ItemDto[], unknown> => {
//   return useQuery(
//     ['getItemList', query],
//     async () => {
//       return getItemList(query)
//     },
//     { retry: false, refetchOnWindowFocus: false, keepPreviousData: true }
//   )
// }
