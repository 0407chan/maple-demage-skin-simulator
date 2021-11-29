import { useGetItemList } from '@/api/damage-skin'
import { SkinMap } from '@/constants/damageSkinMapper'
import { ItemDto } from '@/type/damage-skin'
import React, { useEffect, useState } from 'react'
import ReactGA from 'react-ga4'
import * as S from './style'

type Props = {
  isOpen: boolean
  currentSkin?: ItemDto
  onCancel: () => void
  onConfirm: (num: number) => void
  setCurrentSkin: React.Dispatch<React.SetStateAction<ItemDto | undefined>>
  hideCloseButton?: boolean
}
const Header: React.FC<Props> = ({
  isOpen,
  currentSkin,
  onCancel,
  hideCloseButton = false,
  setCurrentSkin,
  onConfirm
}) => {
  const [skinList, setSkinList] = useState<ItemDto[]>([])
  const [searchKey, setSearchKey] = useState<string>('')

  const [newSkinItems, setNewSkinItems] = useState<ItemDto[]>([])

  const damageSkinItemListQuery = useGetItemList({
    searchFor: '데미지 스킨'
  })

  /**
   * 새로운 스킨이 생겼을때 조회하는 API
   */
  // const [newSkins, setNewSkins] = useState<number[]>([])
  // const damageSkinQuery = useGetDamageSkinAll()
  // useEffect(() => {
  //   const result: number[] = []
  //   const prevSkins = Object.values(SkinMap)
  //   damageSkinQuery.data?.children.forEach((item) => {
  //     if (!prevSkins.find((skin) => skin === Number(item))) {
  //       result.push(Number(item))
  //     }
  //   })
  //   console.log('새 스킨', result)
  //   setNewSkins(result)
  // }, [damageSkinQuery.data])

  useEffect(() => {
    let result: ItemDto[] = []

    damageSkinItemListQuery.data?.forEach((item) => {
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
        if (SkinMap[item.id] === undefined) {
          newSkinItems.push(item)
        }
        if (item.name === '흐물냥 데미지 스킨') {
          setCurrentSkin(item)
        }
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

    // console.log('새 스킨 아이템', newSkinItems)
    setNewSkinItems(newSkinItems)
    setSkinList(result.sort((a, b) => a.id - b.id))
  }, [damageSkinItemListQuery.data])

  // useEffect(() => {
  //   console.log('skinList', skinList)
  // }, [skinList])

  const onCloseModal = () => {
    onCancel()
  }
  const getSearchedList = () => {
    if (searchKey === undefined || searchKey === '') {
      return skinList
    }

    return skinList.filter(
      (item) =>
        item.name.toLocaleLowerCase().indexOf(searchKey.toLocaleLowerCase()) >
        -1
    )
  }

  const highlightDiv = (value: string) => {
    const replacedKeyowrd = searchKey.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
    const parts = value.split(new RegExp(`(${replacedKeyowrd})`, 'gi'))
    return (
      <>
        {parts.map((part, idx) =>
          part.toLowerCase() === searchKey.toLowerCase() ? (
            <S.HighlightText key={idx}>{part}</S.HighlightText>
          ) : (
            <React.Fragment key={idx}>{part}</React.Fragment>
          )
        )}
      </>
    )
  }

  const onSelectSkin = (skin: ItemDto) => {
    // console.log(skin.id, SkinMap[skin.id])
    ReactGA.event({
      category: 'button_click',
      action: 'select_skin',
      label: skin.name,
      value: 1
    })
    setCurrentSkin(skin)
    onConfirm(SkinMap[skin.id])
    onCloseModal()
  }
  return (
    <>
      <S.BackBoard isOpen={isOpen} onClick={onCloseModal} />
      <S.Container isOpen={isOpen}>
        <S.Header>데미지 스킨 선택</S.Header>
        <S.Input
          maxLength={20}
          value={searchKey}
          placeholder="검색"
          onChange={(event) => setSearchKey(event.target.value)}
        />
        {!hideCloseButton && (
          <S.CloseButton size="small" onClick={onCloseModal}>
            <div className="ex left" />
            <div className="ex right" />
          </S.CloseButton>
        )}
        <S.Body>
          {getSearchedList().length > 0 ? (
            getSearchedList().map((skin) => (
              <S.SkinItem
                key={skin.id}
                className={
                  currentSkin && currentSkin.id === skin.id
                    ? 'current-skin'
                    : ''
                }
                onClick={() => onSelectSkin(skin)}
              >
                <img
                  className="skin-img"
                  src={`https://maplestory.io/api/KMS/356/item/${skin.id}/icon`}
                />
                <span
                  className={`skin-text ${
                    currentSkin && currentSkin.id === skin.id
                      ? 'current-skin-text'
                      : ''
                  }`}
                >
                  {skin.name ? highlightDiv(skin.name) : undefined}
                </span>
              </S.SkinItem>
            ))
          ) : (
            <S.InfoText>[{searchKey}] 스킨이 없습니다.</S.InfoText>
          )}
        </S.Body>
      </S.Container>
    </>
  )
}

export default Header
