import useDamage from '@/hooks/useDemage'
import { GetDemageSkinResponse } from '@/type/demage-skin'
import React from 'react'
import { UseQueryResult } from 'react-query'
import * as S from './style'

type Props = {
  skinId: number
  isCritical?: boolean
  demage: number
}
const DamageSkin: React.FC<Props> = ({ skinId, isCritical, demage }) => {
  const {
    Miss,
    criEffect,
    demage0,
    demage1,
    demage2,
    demage3,
    demage4,
    demage5,
    demage6,
    demage7,
    demage8,
    demage9,
    guard,
    numberSpace,
    resist
  } = useDamage({ skinId, skinType: isCritical ? 'NoCri1' : 'NoRed1' })

  const getSkin = (num: number) => {
    switch (num) {
      case 0:
        return demage0
      case 1:
        return demage1
      case 2:
        return demage2
      case 3:
        return demage3
      case 4:
        return demage4
      case 5:
        return demage5
      case 6:
        return demage6
      case 7:
        return demage7
      case 8:
        return demage8
      case 9:
        return demage9
      default:
        return demage9
    }
  }

  const renderDemage = (
    demageQuery: UseQueryResult<GetDemageSkinResponse, unknown>
  ) => {
    if (
      !demageQuery.data ||
      !demageQuery.data.value ||
      demageQuery.data.value === ''
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
        src={`data:image/png;base64,${demageQuery.data.value}`}
      />
    )
  }

  return (
    <S.Container>
      {`${demage}`.split('').map((num, index) => (
        <div key={index}>{renderDemage(getSkin(Number(num)))} </div>
      ))}
    </S.Container>
  )
}

export default DamageSkin
