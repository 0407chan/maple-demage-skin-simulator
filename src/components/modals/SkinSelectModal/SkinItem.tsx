import React from 'react'
import Highlighter from 'react-highlight-words'
import { ItemDto } from 'type/damage-skin'
import styles from './style.module.scss'

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
    <div
      key={skin.id}
      className={`${styles.skinItem} ${currentSkin?.id === skin.id ? styles.currentSkin : ''}`}
      onClick={() => onSelect(skin)}
    >
      <img
        className={styles.skinImg}
        src={`https://maplestory.io/api/KMS/356/item/${skin.id}/icon`}
        alt={skin.name}
      />
      <span
        className={`${styles.skinText} ${currentSkin?.id === skin.id ? styles.currentSkinText : ''}`}
      >
        <Highlighter
          autoEscape
          caseSensitive
          highlightClassName={styles.highlight}
          searchWords={[searchKey]}
          textToHighlight={skin.name ?? ''}
        />
      </span>
    </div>
  )
}
