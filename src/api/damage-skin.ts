import {
  GetDamageSkinQuery,
  GetDamageSkinResponse,
  GetItemListQuery,
  ItemDto
} from '@/type/damage-skin'
import { WzType } from '@/type/wz'
import axios from 'axios'
import { useQuery, UseQueryResult } from 'react-query'

export const getDamageSkin = async (
  query: GetDamageSkinQuery
): Promise<GetDamageSkinResponse> => {
  const result = await axios.get(
    `https://maplestory.io/api/wz/KMS/356/Effect/DamageSkin.img/${query.skinNumber}/${query.skinType}/${query.damageNumber}`
    // `https://maplestory.io/api/wz/KMS/356/Effect/BasicEff.img/${query.skinType}/${query.skinNumber}`
  )
  return result.data
}

export const useGetDamageSkin = (
  query: GetDamageSkinQuery
): UseQueryResult<GetDamageSkinResponse, unknown> => {
  return useQuery(
    ['getDamageSkin', query],
    async () => {
      return getDamageSkin(query)
    },
    {
      enabled: query.skinNumber !== undefined,
      retry: false,
      keepPreviousData: false,
      staleTime: 1000 * 60 * 60,
      refetchOnWindowFocus: false
    }
  )
}

export const getDamageSkinAll = async (): Promise<GetDamageSkinResponse> => {
  const result = await axios.get(
    `https://maplestory.io/api/wz/KMS/356/Effect/DamageSkin.img`
  )
  return result.data
}

export const useGetDamageSkinAll = (): UseQueryResult<
  GetDamageSkinResponse,
  unknown
> => {
  return useQuery(
    ['getDamageSkinAll'],
    async () => {
      return getDamageSkinAll()
    },
    {
      retry: false,
      keepPreviousData: true,
      refetchOnWindowFocus: false
    }
  )
}

export const getItemList = async (
  query?: GetItemListQuery
): Promise<ItemDto[]> => {
  const result = await axios.get('https://maplestory.io/api/KMS/356/item', {
    params: query
  })
  return result.data
}

export const useGetItemList = (
  query?: GetItemListQuery
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
