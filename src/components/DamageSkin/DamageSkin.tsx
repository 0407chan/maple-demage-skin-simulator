import { DamageType, ItemDto } from '@/type/damage-skin'
import React, { useEffect, useState } from 'react'
import * as S from './style'

type Props = {
  damageItem: DamageType
  damageList: DamageType[]
  updateDamageList: (newDamageList: DamageType[]) => void
  currentSkin?: ItemDto
  style?: React.CSSProperties
}
const DamageSkin: React.FC<Props> = ({
  damageItem,
  damageList,
  updateDamageList,
  currentSkin,
  style
}) => {
  const [timer] = useState<number>(1000)
  const [visible, setVisible] = useState<boolean>(true)

  const getSkin1Image = (num: number) => {
    if (damageItem.isCritical) {
      return `${process.env.PUBLIC_URL}/images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoCri1-${num}.png`
    } else {
      return `${process.env.PUBLIC_URL}/images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoRed1-${num}.png`
    }
  }
  const getSkin0Image = (num: number) => {
    if (damageItem.isCritical) {
      return `${process.env.PUBLIC_URL}/images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoCri0-${num}.png`
    } else {
      return `${process.env.PUBLIC_URL}/images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoRed0-${num}.png`
    }
  }

  const isUnit = () => currentSkin?.name.includes('유닛')

  const getUnit = (unit: '만' | '억') => {
    if (damageItem.isCritical) {
      if (unit === '만') {
        return `${process.env.PUBLIC_URL}/images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoCustom-NoCri1-3.png` // 만
      } else {
        return `${process.env.PUBLIC_URL}/images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoCustom-NoCri1-4.png` // 억
      }
    } else {
      if (unit === '만') {
        return `${process.env.PUBLIC_URL}/images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoCustom-NoRed1-3.png`
      } else {
        return `${process.env.PUBLIC_URL}/images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoCustom-NoRed1-4.png`
      }
    }
  }

  const getCriticalImage = () => {
    return `${process.env.PUBLIC_URL}/images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoCri1-effect3.png`
  }

  const getDamageString = () => {
    if (isUnit()) {
      const numString = `${damageItem.damage}`
      let result = ''
      if (numString.length <= 12 && numString.length > 8) {
        result += `${numString.slice(-12, -8)}억`
        if (Number(numString.slice(-8, -4)) > 0) {
          result += `${numString.slice(-8, -4)}만`
        }
        if (Number(numString.slice(-4)) > 0) {
          result += `${numString.slice(-4)}`
        }
      }
      // 만
      else if (numString.length <= 8 && numString.length > 4) {
        result += `${numString.slice(-8, -4)}만`
        if (Number(numString.slice(-4)) > 0) {
          result += `${numString.slice(-4)}`
        }
      } else {
        result += `${numString.slice(-4)}`
      }
      return result
    } else {
      return `${damageItem.damage}`
    }
  }

  useEffect(() => {
    setTimeout(() => {
      updateDamageList(damageList.filter((item) => item.id !== damageItem.id))
      setVisible(false)
    }, timer)
  }, [])

  if (!visible) return null
  return (
    <S.Container
      className="no-drag"
      delay={damageItem.level}
      style={{ ...style, marginBottom: damageItem.marginBottom }}
      // stop
    >
      {damageItem.isCritical && (
        <S.CriEffect>
          <img draggable={false} alt="critical-img" src={getCriticalImage()} />
        </S.CriEffect>
      )}
      {getDamageString()
        .split('')
        .map((num, index) => (
          <img
            key={index}
            style={{
              width: 'fit-content',
              height: 'fit-content',
              zIndex: index + 1,
              marginBottom: index % 2 === 0 ? 4 : 0,
              marginTop: index % 2 === 1 ? 4 : 0
            }}
            draggable={false}
            alt={`skin-img-${num}-${index}`}
            src={
              num === '만' || num === '억'
                ? getUnit(num as '만' | '억')
                : index === 0
                ? getSkin1Image(Number(num))
                : getSkin0Image(Number(num))
            }
          />
        ))}
    </S.Container>
  )
}

export default DamageSkin
