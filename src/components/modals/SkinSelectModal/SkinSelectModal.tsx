import { useGetItemList } from 'api/damage-skin'
import { wzVersionState } from 'atoms/wzVersion'
import { SkinMap } from 'constants/damageSkinMapper'
import useBoolean from 'hooks/useBoolean'
import React, { useEffect, useState } from 'react'
import ReactGA from 'react-ga4'
import Highlighter from 'react-highlight-words'
import { useRecoilState } from 'recoil'
import { ItemDto } from 'type/damage-skin'
import * as S from './style'
import { filterSkinItems } from './util'

type Props = {
  currentSkin?: ItemDto
  onConfirm: (num: number) => void
  setCurrentSkin: (skin?: ItemDto) => void
  hideCloseButton?: boolean
}
const SkinSelectModal: React.FC<Props> = ({
  currentSkin,
  hideCloseButton = false,
  setCurrentSkin,
  onConfirm
}) => {
  const [open, { setTrue: onOpen, setFalse: onClose }] = useBoolean(false)
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
  //   damageSkinQuery.data?.children.forEach((item: any) => {
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
    if (!currentSkin) {
      setCurrentSkin(
        currentItemList.find((item) => item.name.includes('흐물냥 데미지 스킨'))
      )
    }
    // setNewSkinItems(newSkinItems)

    setSkinList(currentItemList)
  }, [currentDamageSkinItemListQuery.data, latestDamageSkinItemListQuery.data])

  // useEffect(() => {
  //   console.log('skinList', skinList)
  // }, [skinList])

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
    onClose()
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
          className={`skin-text ${currentSkin && currentSkin.id === skin.id ? 'current-skin-text' : ''
            }`}
        >
          <Highlighter
            autoEscape
            caseSensitive
            highlightClassName="highlight"
            searchWords={[searchKey]}
            textToHighlight={skin.name ?? ''}
          />
        </span>
      </S.SkinItem>
    )
  }
  return (
    <>
      {currentSkin && (
        <S.SkinButton style={{
          position: 'absolute',
          top: 8,
          left: 0,
        }} onClick={onOpen}>
          <img
            className="skin-img"
            src={`https://maplestory.io/api/KMS/356/item/${currentSkin.id}/icon`}
          />
          <span className="skin-text">{currentSkin.name}</span>
        </S.SkinButton>)}
      <S.BackBoard open={open} onClick={onClose} />
      <S.Container open={open}>
        <S.Header>데미지 스킨 선택</S.Header>
        <S.Input
          maxLength={20}
          value={searchKey}
          placeholder="검색"
          onChange={(event) => setSearchKey(event.target.value)}
        />
        {!hideCloseButton && (
          <S.CloseButton size="small" onClick={onClose}>
            <div className="ex left" />
            <div className="ex right" />
          </S.CloseButton>
        )}
        {currentSkin !== undefined ? (
          <>
            <div style={{ color: '#eeeeee' }}>현재 스킨</div>
            {renderDamageItem(currentSkin)}
            <S.Divider />
          </>
        ) : null}

        <S.Body>
          {/* {getLatestSearchedList().length > 0 && (
            <S.NewSkinListWrapper>
              <Horizontal style={{ justifyContent: 'center', marginTop: 5 }}>
                <S.NewBadge>NEW</S.NewBadge>
              </Horizontal>
              {getLatestSearchedList().map((skin) => renderDamageItem(skin))}
              <S.Divider />
            </S.NewSkinListWrapper>
          )} */}
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

export default SkinSelectModal
