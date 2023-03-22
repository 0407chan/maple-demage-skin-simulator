import React from 'react'
import { DamageType, ItemDto } from 'type/damage-skin'
import * as S from './style'

type Props = {
  damageItem: DamageType
  currentSkin?: ItemDto
}
const DamageSkin: React.FC<Props> = ({ damageItem, currentSkin }) => {
  const getSkin1Image = (num: number) => {
    let newNum = num
    if (currentSkin?.name.includes('럭키세븐')) {
      newNum = 0
    }
    if (damageItem.isCritical) {
      return `./images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoCri1-${newNum}.png`
    } else {
      return `./images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoRed1-${newNum}.png`
    }
  }
  const getSkin0Image = (num: number) => {
    let newNum = num
    if (currentSkin?.name.includes('럭키세븐')) {
      newNum = 0
    }
    if (damageItem.isCritical) {
      return `./images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoCri0-${newNum}.png`
    } else {
      return `./images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoRed0-${newNum}.png`
    }
  }

  const isUnit = () => currentSkin?.name.includes('유닛')

  const getUnit = (unit: '만' | '억') => {
    if (damageItem.isCritical) {
      if (unit === '만') {
        return `./images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoCustom-NoCri1-3.png` // 만
      } else {
        return `./images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoCustom-NoCri1-4.png` // 억
      }
    } else {
      if (unit === '만') {
        return `./images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoCustom-NoRed1-3.png`
      } else {
        return `./images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoCustom-NoRed1-4.png`
      }
    }
  }

  const getCriticalImage = () => {
    return `./images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoCri1-effect3.png`
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

  return (
    <S.Container
      className="no-drag"
      delay={damageItem.level}
      style={{ bottom: damageItem.marginBottom }}
      // stop = 멈춤
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

              // 데미지 스킨의 자연스러운 지그재그를 위한 margin
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
