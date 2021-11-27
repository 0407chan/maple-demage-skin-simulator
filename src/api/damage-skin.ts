import {
  GetDamageSkinQuery,
  GetDamageSkinResponse,
  GetItemListQuery,
  ItemDto,
  SkinType
} from '@/type/damage-skin'
import axios from 'axios'
import { useQuery, UseQueryResult } from 'react-query'

export const getDamageSkin = async (
  query: GetDamageSkinQuery
): Promise<GetDamageSkinResponse> => {
  const result = await axios.get(
    `https://maplestory.io/api/wz/KMS/353/Effect/DamageSkin.img/${query.skinNumber}/${query.skinType}/${query.damageNumber}`
    // `https://maplestory.io/api/wz/KMS/353/Effect/BasicEff.img/${query.skinType}/${query.skinNumber}`
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

export const getDamageSkinAll = async (query: {
  skinNumber: number
  skinType: SkinType
}): Promise<GetDamageSkinResponse> => {
  const result = await axios.get(
    `https://maplestory.io/api/wz/KMS/353/Effect/DamageSkin.img/${query.skinNumber}/${query.skinType}`
  )
  return result.data
}

export const useGetDamageSkinAll = (query: {
  skinNumber: number
  skinType: SkinType
}): UseQueryResult<GetDamageSkinResponse, unknown> => {
  return useQuery(
    ['getDamageSkinAll', query],
    async () => {
      return getDamageSkinAll(query)
    },
    {
      enabled: query.skinNumber !== undefined,
      retry: false,
      keepPreviousData: true,
      refetchOnWindowFocus: false
    }
  )
}

export const getWzImage = async (): Promise<GetDamageSkinResponse> => {
  const result = await axios.get(
    `https://maplestory.io/api/wz/KMS/353/UI/UIWindow4.img/enchantUI/miniGame/star/STAR`
    // `https://maplestory.io/api/wz/KMS/353/UI/UIWindow4.img/enchantUI/miniGame/particle/0`
  )
  return result.data
}

export const useGetWzImage = (): UseQueryResult<
  GetDamageSkinResponse,
  unknown
> => {
  return useQuery(
    ['getWzImage'],
    async () => {
      return getWzImage()
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
