import { ItemDto } from 'type/damage-skin'

export const filterSkinItems = (itemList: ItemDto[]): ItemDto[] => {
  let result: ItemDto[] = []

  itemList.forEach((item) => {
    if (
      !result.find(
        (skin) =>
          skin.name !== '파티 퀘스트 데미지 스킨' && skin.name === item.name
      ) &&
      item.name.includes('데미지 스킨') &&
      !item.name.includes('상자') &&
      !item.name.includes('저장 스크롤') &&
      !item.name.includes('1칸 확장권') &&
      !item.name.includes('선택권') &&
      !item.name.includes('추출권') &&
      !item.name.includes('보름달 티켓') &&
      !item.name.includes('VIP 티켓') &&
      !item.name.includes('RISE 티켓') &&
      !item.name.includes('각성의 티켓') &&
      !item.name.includes('교환권')
    ) {
      result.push(item)
    }
  })

  let isPartyQuest = 0
  result = result.filter((item) => {
    if (item.name !== '파티 퀘스트 데미지 스킨') {
      return true
    } else if (item.name === '파티 퀘스트 데미지 스킨') {
      if (isPartyQuest < 2) {
        isPartyQuest += 1
        return true
      } else {
        return false
      }
    }
  })

  return result
}
