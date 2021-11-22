import { useGetItemList } from '@/api/damage-skin'
import useWindowSize from '@/hooks/useWindowSize'
import { ItemDto } from '@/type/damage-skin'
import React, { useEffect, useState } from 'react'
import * as S from './style'

type Props = {
  isOpen: boolean
  onCancel: () => void
  hideCloseButton?: boolean
}
const Header: React.FC<Props> = ({
  isOpen,
  onCancel,
  hideCloseButton = false
}) => {
  const [skinList, setSkinList] = useState<ItemDto[]>([])
  const [searchKey, setSearchKey] = useState<string>('')
  const { isMobile } = useWindowSize()
  const damageSkinList = useGetItemList({
    // cashFilter: false,
    // categoryFilter: 'Consumable',
    // overallCategoryFilter: 'Use',
    searchFor: '데미지 스킨'
    // subCategoryFilter: 'Other'
  })
  useEffect(() => {
    const result: ItemDto[] = []
    damageSkinList.data?.forEach((item) => {
      if (
        !result.find((skin) => skin.name === item.name) &&
        item.name.includes('데미지 스킨') &&
        !item.name.includes('상자') &&
        !item.name.includes('저장 스크롤') &&
        !item.name.includes('1칸 확장권')
      ) {
        result.push(item)
      }
    })
    setSkinList(result)
  }, [damageSkinList.data])

  useEffect(() => {
    console.log('skinList', skinList)
  }, [skinList])

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

  return (
    <>
      <S.BackBoard isOpen={isOpen} onClick={onCancel} />
      <S.Container isOpen={isOpen}>
        <S.Header>데미지 스킨 선택</S.Header>
        {!hideCloseButton && (
          <S.CloseButton onClick={onCancel}>✖</S.CloseButton>
        )}
        <S.Body>
          {skinList.map((skin, index) => (
            <S.SkinItem key={index}>
              <img
                className="skin-img"
                src={`https://maplestory.io/api/KMS/352/item/${skin.id}/icon`}
              />
              <span className="skin-text">
                {skin.name ? highlightDiv(skin.name) : undefined}
              </span>
            </S.SkinItem>
          ))}
        </S.Body>
      </S.Container>
    </>
  )
}

export default Header
