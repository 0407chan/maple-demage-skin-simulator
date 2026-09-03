import { wzVersionState } from 'atoms/wzVersion'
import React from 'react'
import Highlighter from 'react-highlight-words'
import { useRecoilValue } from 'recoil'
import { ItemDto } from 'type/damage-skin'
import styles from './style.module.scss'

type SkinItemProps = {
  skin: ItemDto
  currentSkin?: ItemDto
  displayName: string
  nameLanguage: string
  searchKey: string
  onSelect: (skin: ItemDto) => void
}

export const SkinItem: React.FC<SkinItemProps> = ({
  skin,
  currentSkin,
  displayName,
  nameLanguage,
  searchKey,
  onSelect
}) => {
  const wzVersion = useRecoilValue(wzVersionState)
  const isCurrent = currentSkin?.id === skin.id

  return (
    <button
      type="button"
      className={`${styles.skinItem} ${isCurrent ? styles.currentSkin : ''}`}
      onClick={() => onSelect(skin)}
      aria-pressed={isCurrent}
    >
      <span className={styles.itemIconFrame} aria-hidden="true">
        <img
          className={styles.skinImg}
          src={`https://maplestory.io/api/${wzVersion.region}/${wzVersion.version}/item/${skin.id}/icon`}
          alt=""
        />
      </span>
      <span className={styles.skinText} lang={nameLanguage}>
        <Highlighter
          autoEscape
          caseSensitive={false}
          highlightClassName={styles.highlight}
          searchWords={[searchKey]}
          textToHighlight={displayName}
        />
      </span>
      {isCurrent && (
        <span className={styles.selectedIndicator} aria-hidden="true">
          <svg viewBox="0 0 20 20">
            <path d="m5 10 3 3 7-7" />
          </svg>
        </span>
      )}
    </button>
  )
}
