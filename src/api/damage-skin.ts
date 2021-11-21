import {
  GetDamageSkinQuery,
  GetDamageSkinResponse,
  SkinType
} from '@/type/damage-skin'
import axios from 'axios'
import { useQuery, UseQueryResult } from 'react-query'

export const getDamageSkin = async (
  query: GetDamageSkinQuery
): Promise<GetDamageSkinResponse> => {
  const result = await axios.get(
    `https://maplestory.io/api/wz/KMS/353/Effect/DamageSkin.img/${query.skinId}/${query.skinType}/${query.skinNumber}`
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
      enabled: query.skinId !== undefined,
      retry: false,
      keepPreviousData: false,
      refetchOnWindowFocus: false
    }
  )
}

export const getDamageSkinAll = async (query: {
  skinId: number
  skinType: SkinType
}): Promise<GetDamageSkinResponse> => {
  const result = await axios.get(
    `https://maplestory.io/api/wz/KMS/353/Effect/DamageSkin.img/${query.skinId}/${query.skinType}`
  )
  return result.data
}

export const useGetDamageSkinAll = (query: {
  skinId: number
  skinType: SkinType
}): UseQueryResult<GetDamageSkinResponse, unknown> => {
  return useQuery(
    ['getDamageSkinAll', query],
    async () => {
      return getDamageSkinAll(query)
    },
    {
      enabled: query.skinId !== undefined,
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
