import { useGetItemList } from 'api/damage-skin'
import { wzVersionState } from 'atoms/wzVersion'
import { useRecoilState } from 'recoil'
import { SkinMap } from 'constants/damageSkinMapper'
import { useMemo } from 'react'
import { uniqueSkinItemsByName } from './util'
import { useLocalizedGameContent } from 'hooks/useLocalizedGameContent'

const LOCALIZED_RESULT_COUNT = 50

export const useSkinList = (localizedSearchTerm = '') => {
  const [wzVersion] = useRecoilState(wzVersionState)
  const localizedContent = useLocalizedGameContent()

  const damageSkinItemListQuery = useGetItemList({
    searchFor: '데미지 스킨',
    version: wzVersion?.version,
    region: wzVersion?.region
  })
  const normalizedLocalizedSearchTerm = localizedSearchTerm.trim()
  const localizedItemListQuery = useGetItemList(
    {
      searchFor: normalizedLocalizedSearchTerm,
      startPosition: 0,
      count: LOCALIZED_RESULT_COUNT,
      version: localizedContent.version,
      region: localizedContent.region
    },
    localizedContent.locale !== 'ko' && normalizedLocalizedSearchTerm.length > 0
  )

  const filteredLists = useMemo(() => {
    if (!damageSkinItemListQuery.data) {
      return { currentItemList: [], newSkinItemList: [] }
    }

    const allItems = [...damageSkinItemListQuery.data].sort(
      (a, b) => a.id - b.id
    )

    // SkinMap에 존재하는 아이템들
    const currentItemList = uniqueSkinItemsByName(
      allItems.filter((item) => SkinMap[item.id] !== undefined)
    )

    // SkinMap에 존재하지 않는 아이템들 (새 스킨)
    const newSkinItemList = allItems.filter(
      (item) => SkinMap[item.id] === undefined
    )

    return { currentItemList, newSkinItemList }
  }, [damageSkinItemListQuery.data])

  const localizedNames = useMemo(
    () =>
      new Map(
        (localizedItemListQuery.data ?? []).map((item) => [item.id, item.name])
      ),
    [localizedItemListQuery.data]
  )

  return {
    ...filteredLists,
    localizedNames,
    isLoading: damageSkinItemListQuery.isLoading,
    isLocalizedSearching: localizedItemListQuery.isFetching
  }
}
