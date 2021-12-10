import { useGetItemList } from '@/api/damage-skin'
import { wzVersionState } from '@/atoms/wzVersion'
import Horizontal from '@/components/Horizontal'
import { SkinMap } from '@/constants/damageSkinMapper'
import { ItemDto } from '@/type/damage-skin'
import React, { useEffect, useState } from 'react'
import ReactGA from 'react-ga4'
import { useRecoilState } from 'recoil'
import * as S from './style'
import { filterSkinItems } from './util'

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
  const [wzVersion, setWzVersion] = useRecoilState(wzVersionState)
  const latestDamageSkinItemListQuery = useGetItemList({
    searchFor: '데미지 스킨',
    version: wzVersion
  })
  const currentDamageSkinItemListQuery = useGetItemList({
    searchFor: '데미지 스킨',
    version: 355
  })

  /**
   * 새로운 스킨이 생겼을때 조회하는 API
   */
  // const [newSkins, setNewSkins] = useState<number[]>([])
  // const damageSkinQuery = useGetDamageSkinAll(wzVersion)
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
    if (
      currentDamageSkinItemListQuery.data === undefined ||
      latestDamageSkinItemListQuery.data === undefined
    ) {
      return
    }

    const currentItemList = filterSkinItems(
      currentDamageSkinItemListQuery.data
    ).sort((a, b) => a.id - b.id)

    const latestItemList = filterSkinItems(
      latestDamageSkinItemListQuery.data
    ).sort((a, b) => a.id - b.id)

    const newSkinItemList: ItemDto[] = []
    latestItemList.forEach((item) => {
      if (!currentItemList.find((current) => current.id === item.id)) {
        newSkinItemList.push(item)
      }
    })

    setNewSkinItems(newSkinItemList)
    setCurrentSkin(
      currentItemList.find((item) => item.name.includes('흐물냥 데미지 스킨'))
    )
    // setNewSkinItems(newSkinItems)

    setSkinList(currentItemList)
  }, [currentDamageSkinItemListQuery.data, latestDamageSkinItemListQuery.data])

  // useEffect(() => {
  //   console.log('skinList', skinList)
  // }, [skinList])

  const onCloseModal = () => {
    onCancel()
  }
  const getLatestSearchedList = () => {
    if (searchKey === undefined || searchKey === '') {
      return newSkinItems
    }

    return newSkinItems.filter(
      (item) =>
        item.name.toLocaleLowerCase().indexOf(searchKey.toLocaleLowerCase()) >
        -1
    )
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

  const renderDamageItem = (skin: ItemDto) => {
    return (
      <S.SkinItem
        key={skin.id}
        className={
          currentSkin && currentSkin.id === skin.id ? 'current-skin' : ''
        }
        onClick={() => onSelectSkin(skin)}
      >
        <img
          className="skin-img"
          src={`https://maplestory.io/api/KMS/356/item/${skin.id}/icon`}
        />
        <span
          className={`skin-text ${
            currentSkin && currentSkin.id === skin.id ? 'current-skin-text' : ''
          }`}
        >
          {skin.name ? highlightDiv(skin.name) : undefined}
        </span>
      </S.SkinItem>
    )
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
          {getLatestSearchedList().length > 0 && (
            <S.NewSkinListWrapper>
              <Horizontal style={{ justifyContent: 'center', marginTop: 5 }}>
                <S.NewBadge>NEW</S.NewBadge>
              </Horizontal>
              {getLatestSearchedList().map((skin) => renderDamageItem(skin))}
              <S.Divider />
            </S.NewSkinListWrapper>
          )}
          {getSearchedList().length > 0 ? (
            getSearchedList().map((skin) => renderDamageItem(skin))
          ) : (
            <S.InfoText>[{searchKey}] 스킨이 없습니다.</S.InfoText>
          )}
        </S.Body>
      </S.Container>
    </>
  )
}

export default Header
