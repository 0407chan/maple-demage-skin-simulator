import Horizontal from 'components/Horizontal'
import React, { useEffect, useState } from 'react'
import { DamageWrapperType, ItemDto } from 'type/damage-skin'
import DamageSkin from '../DamageSkin'
import * as S from './style'

type Props = {
  damageWrapper: DamageWrapperType
  setDamageWrapperList: React.Dispatch<
    React.SetStateAction<DamageWrapperType[]>
  >
  currentSkin?: ItemDto
}
const DamageWrapper: React.FC<Props> = ({
  damageWrapper,
  setDamageWrapperList,
  currentSkin
}) => {
  const [timer] = useState<number>(2000)
  const [visible, setVisible] = useState<boolean>(true)

  // 일정 시간 지난후 dom 제거
  useEffect(() => {
    setTimeout(() => {
      setDamageWrapperList((prev) => {
        return prev.filter((item) => item.id !== damageWrapper.id)
      })
      setVisible(false)
    }, timer)
  }, [])

  if (!visible) return null
  return (
    <S.Container>
      <Horizontal style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
        {damageWrapper.damageList.map((item) => (
          <DamageSkin
            key={item.id}
            damageItem={item}
            currentSkin={currentSkin}
          />
        ))}
      </Horizontal>
    </S.Container>
  )
}

export default DamageWrapper
