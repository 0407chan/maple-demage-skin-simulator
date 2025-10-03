import { useGetItemList } from 'api/damage-skin'
import { wzVersionState } from 'atoms/wzVersion'
import { useRecoilState } from 'recoil'
import { filterSkinItems } from './util'

export const useSkinList = () => {
  const [wzVersion] = useRecoilState(wzVersionState)

  const latestDamageSkinItemListQuery = useGetItemList({
    searchFor: '데미지 스킨',
    version: wzVersion?.version,
    region: wzVersion?.region
  })

  const currentDamageSkinItemListQuery = useGetItemList({
    searchFor: '데미지 스킨',
    version: 355,
    region: 'KMS'
  })

  const getFilteredLists = () => {
    if (
      !currentDamageSkinItemListQuery.data ||
      !latestDamageSkinItemListQuery.data
    ) {
      return { currentItemList: [], newSkinItemList: [] }
    }

    const currentItemList = filterSkinItems(
      currentDamageSkinItemListQuery.data
    ).sort((a, b) => a.id - b.id)

    const latestItemList = filterSkinItems(
      latestDamageSkinItemListQuery.data
    ).sort((a, b) => a.id - b.id)

    const newSkinItemList = latestItemList.filter(
      (item) => !currentItemList.find((current) => current.id === item.id)
    )

    return { currentItemList, newSkinItemList }
  }

  return {
    ...getFilteredLists(),
    isLoading:
      currentDamageSkinItemListQuery.isLoading ||
      latestDamageSkinItemListQuery.isLoading
  }
}
