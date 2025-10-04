import { useGetItemList } from 'api/damage-skin'
import { wzVersionState } from 'atoms/wzVersion'
import { useRecoilState } from 'recoil'
import { SkinMap } from 'constants/damageSkinMapper'
import { useEffect } from 'react'

export const useSkinList = () => {
  const [wzVersion] = useRecoilState(wzVersionState)

  const damageSkinItemListQuery = useGetItemList({
    searchFor: '데미지 스킨',
    version: wzVersion?.version,
    region: wzVersion?.region
  })

  const getFilteredLists = () => {
    if (!damageSkinItemListQuery.data) {
      return { currentItemList: [], newSkinItemList: [] }
    }

    const allItems = damageSkinItemListQuery.data.sort((a, b) => a.id - b.id)

    // SkinMap에 존재하는 아이템들
    const currentItemList = allItems.filter(
      (item) => SkinMap[item.id] !== undefined
    )

    // SkinMap에 존재하지 않는 아이템들 (새 스킨)
    const newSkinItemList = allItems.filter(
      (item) => SkinMap[item.id] === undefined
    )

    return { currentItemList, newSkinItemList }
  }

  return {
    ...getFilteredLists(),
    isLoading: damageSkinItemListQuery.isLoading
  }
}
