import useDamage from '@/hooks/useDamage'
import { GetDamageSkinResponse } from '@/type/damage-skin'
import React from 'react'
import { UseQueryResult } from 'react-query'
import * as S from './style'

type Props = {
  skinId: number
  isCritical?: boolean
  damage: number
}
const DamageSkin: React.FC<Props> = ({ skinId, isCritical, damage }) => {
  const {
    Miss,
    criEffect,
    damage0,
    damage1,
    damage2,
    damage3,
    damage4,
    damage5,
    damage6,
    damage7,
    damage8,
    damage9,
    guard,
    numberSpace,
    resist
  } = useDamage({ skinId, skinType: isCritical ? 'NoCri1' : 'NoRed1' })

  const getSkin = (num: number) => {
    switch (num) {
      case 0:
        return damage0
      case 1:
        return damage1
      case 2:
        return damage2
      case 3:
        return damage3
      case 4:
        return damage4
      case 5:
        return damage5
      case 6:
        return damage6
      case 7:
        return damage7
      case 8:
        return damage8
      case 9:
        return damage9
      default:
        return damage9
    }
  }

  const renderDamage = (
    damageQuery: UseQueryResult<GetDamageSkinResponse, unknown>
  ) => {
    if (
      !damageQuery.data ||
      !damageQuery.data.value ||
      damageQuery.data.value === ''
    )
      return null

    return (
      <img
        style={{
          display: 'flex',
          width: 'fit-content',
          marginLeft:
            numberSpace.data?.value !== undefined &&
            Number(numberSpace.data?.value) < 0
              ? Number(numberSpace.data?.value)
              : undefined
        }}
        src={`data:image/png;base64,${damageQuery.data.value}`}
      />
    )
  }

  return (
    <S.Container>
      {`${damage}`.split('').map((num, index) => (
        <div key={index}>{renderDamage(getSkin(Number(num)))} </div>
      ))}
    </S.Container>
  )
}

export default DamageSkin
