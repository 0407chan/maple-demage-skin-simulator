import { DamageType } from '@/type/damage-skin'
import React, { useEffect, useState } from 'react'
import * as S from './style'

type Props = {
  damageItem: DamageType
  setDamageList: React.Dispatch<React.SetStateAction<DamageType[]>>
}
const DamageSkin: React.FC<Props> = ({ damageItem, setDamageList }) => {
  const [timer, setTimer] = useState<number>(1000)
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

  const getCriticalImage = () => {
    return `${process.env.PUBLIC_URL}/images/export/Effect-DamageSkin.img-${damageItem.skinNumber}-NoCri1-effect3.png`
  }

  useEffect(() => {
    setTimeout(() => {
      setDamageList((prev) => {
        return prev.filter((item) => item.id !== damageItem.id)
      })
      setVisible(false)
    }, timer)
  }, [])

  if (!visible) return null

  return (
    <S.Container className="no-drag">
      {damageItem.isCritical && (
        <S.CriEffect>
          <img draggable={false} alt="critical-img" src={getCriticalImage()} />
        </S.CriEffect>
      )}
      {`${damageItem.damage}`.split('').map((num, index) => (
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
            index === 0
              ? getSkin1Image(Number(num))
              : getSkin0Image(Number(num))
          }
        />
      ))}
    </S.Container>
  )
}

export default DamageSkin
