import React, { useState } from 'react'
import { v4 as uuid } from 'uuid'
import * as S from './appStyle'
import DamageSkin from './components/DamageSkin'
import Header from './components/Header'
import Horizontal from './components/Horizontal'
import { DamageType } from './type/damage-skin'

const hitImage = `${process.env.PUBLIC_URL}/images/hit1_0.png`
const standImage = 'https://maplestory.io/api/KMS/356/mob/100004/render/stand'

const App: React.FC = () => {
  const [skinNumber, setSkinNumber] = useState<number>(287)
  const [damageList, setDamageList] = useState<DamageType[]>([])
  const [isAttacked, setIsAttacked] = useState<boolean>(false)
  // const damageAll = useGetDamageSkinAll({ skinNumber, skinType })

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
