import React, { useState } from 'react'
import { v4 as uuid } from 'uuid'
import { useGetDamageSkinAll } from './api/damage-skin'
import * as S from './appStyle'
import DamageSkin from './components/DamageSkin'
import Header from './components/Header'
import Horizontal from './components/Horizontal'
import { DamageType, SkinType } from './type/damage-skin'

const skinTypeOptions = [
  { label: '일반0', value: 'NoRed0' },
  { label: '일반1', value: 'NoRed1' },
  { label: '크리티컬0', value: 'NoCri0' },
  { label: '크리티컬1', value: 'NoCri1' },
  { label: '뭐야', value: 'NoRed3' }
]

const hitImage = `${process.env.PUBLIC_URL}/images/hit1_0.png`
const standImage = 'https://maplestory.io/api/KMS/356/mob/100004/render/stand'

const App: React.FC = () => {
  const [skinNumber, setSkinNumber] = useState<number>(287)
  const [skinType, setSkinType] = useState<SkinType>('NoCri1')
  const [damageList, setDamageList] = useState<DamageType[]>([])
  const [isAttacked, setIsAttacked] = useState<boolean>(false)
  const damageAll = useGetDamageSkinAll({ skinNumber, skinType })

  const onSetSkinNumber = (newId: number) => {
    setSkinNumber(newId)
    setDamageList([])
  }

  const onAttack = () => {
    setIsAttacked(true)
    const newDamage: DamageType = {
      id: uuid(),
      skinNumber,
      damage: getRandomInt(100000, 400000),
      isCritical: Math.random() * 100 < 60
    }
    setTimeout(() => {
      setIsAttacked(false)
    }, 1000)
    setDamageList([...damageList, newDamage])
  }

  function getRandomInt(min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min //최댓값은 제외, 최솟값은 포함
  }

  return (
    <S.Container>
      <S.Header>
        <Header {...{ onSetSkinNumber, skinNumber }} />
      </S.Header>
      <S.Body className="no-drag">
        <Horizontal style={{ justifyContent: 'center' }}>
          {damageList.map((item) => (
            <DamageSkin
              key={item.id}
              damageItem={item}
              setDamageList={setDamageList}
              skinNumber={skinNumber}
            />
          ))}
        </Horizontal>
        <S.OrangeMushroom
          draggable="false"
          src={isAttacked ? hitImage : standImage}
          alt="orange-mushroom"
          onClick={() => onAttack()}
        />
      </S.Body>
    </S.Container>
  )
}

export default App
