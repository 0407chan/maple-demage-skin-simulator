import Button from 'antd/lib/button'
import InputNumber from 'antd/lib/input-number'
import React, { useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { useGetDamageSkinAll } from './api/damage-skin'
import * as S from './appStyle'
import DamageSkin from './components/DamageSkin'
import Horizontal from './components/Horizontal'
import { DamageType, SkinType } from './type/damage-skin'

const skinTypeOptions = [
  { label: '일반0', value: 'NoRed0' },
  { label: '일반1', value: 'NoRed1' },
  { label: '크리티컬0', value: 'NoCri0' },
  { label: '크리티컬1', value: 'NoCri1' },
  { label: '뭐야', value: 'NoRed3' }
]
const App: React.FC = () => {
  const [skinNumber, setSkinId] = useState<number>(200)
  const [skinType, setSkinType] = useState<SkinType>('NoCri1')
  const [damageList, setDamageList] = useState<DamageType[]>([])

  const damageAll = useGetDamageSkinAll({ skinNumber, skinType })

  const onSetSkinId = (newId: number) => {
    setSkinId(newId)
    setDamageList([])
  }

  useEffect(() => {
    console.log(damageAll.data?.children)
  }, [damageAll.data])

  const onAttack = () => {
    const newDamage: DamageType = {
      id: uuid(),
      skinNumber,
      damage: getRandomInt(100000, 400000),
      isCritical: Math.random() * 100 < 60
    }
    setDamageList([...damageList, newDamage])
  }

  function getRandomInt(min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min //최댓값은 제외, 최솟값은 포함
  }

  return (
    <S.Container>
      {/* <S.Header>
      </S.Header> */}
      <Horizontal style={{ margin: '60px 0', justifyContent: 'center' }}>
        <Button
          disabled={skinNumber === 1}
          onClick={() => onSetSkinId(skinNumber - 1)}
        >
          -
        </Button>
        <InputNumber
          value={skinNumber}
          onChange={(value) => onSetSkinId(value)}
        />
        <Button onClick={() => onSetSkinId(skinNumber + 1)}>+</Button>
      </Horizontal>
      <S.Body>
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
          className="no-drag"
          src="https://maplestory.io/api/KMS/356/mob/100004/render/stand"
          alt="orange-mushroom"
          onClick={() => onAttack()}
        />
      </S.Body>
    </S.Container>
  )
}

export default App
