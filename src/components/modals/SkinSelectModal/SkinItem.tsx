import React from 'react'
import Highlighter from 'react-highlight-words'
import { ItemDto } from 'type/damage-skin'
import * as S from './style'

type SkinItemProps = {
  skin: ItemDto
  currentSkin?: ItemDto
  searchKey: string
  onSelect: (skin: ItemDto) => void
}

export const SkinItem: React.FC<SkinItemProps> = ({
  skin,
  currentSkin,
  searchKey,
  onSelect
}) => {
  return (
    <S.SkinItem
      key={skin.id}
      className={currentSkin?.id === skin.id ? 'current-skin' : ''}
      onClick={() => onSelect(skin)}
    >
      <img
        className="skin-img"
        src={`https://maplestory.io/api/KMS/356/item/${skin.id}/icon`}
        alt={skin.name}
      />
      <span
        className={`skin-text ${currentSkin?.id === skin.id ? 'current-skin-text' : ''}`}
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
