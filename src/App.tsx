import Button from 'antd/lib/button'
import InputNumber from 'antd/lib/input-number'
import Radio from 'antd/lib/radio'
import React, { useEffect, useState } from 'react'
import { UseQueryResult } from 'react-query'
import { useGetDamageSkinAll } from './api/damage-skin'
import * as S from './appStyle'
import DamageSkin from './components/DamageSkin'
import Horizontal from './components/Horizontal'
import useDamage from './hooks/useDamage'
import { GetDamageSkinResponse, SkinType } from './type/damage-skin'

const skinTypeOptions = [
  { label: '일반0', value: 'NoRed0' },
  { label: '일반1', value: 'NoRed1' },
  { label: '크리티컬0', value: 'NoCri0' },
  { label: '크리티컬1', value: 'NoCri1' },
  { label: '뭐야', value: 'NoRed3' }
]
const App: React.FC = () => {
  const [skinId, setSkinId] = useState<number>(200)
  const [skinType, setSkinType] = useState<SkinType>('NoCri1')

  const damageAll = useGetDamageSkinAll({ skinId, skinType })
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
  } = useDamage({ skinId, skinType })

  useEffect(() => {
    console.log(damageAll.data?.children)
  }, [damageAll.data])

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
      {/* <S.Header>
      </S.Header> */}
      <Horizontal style={{ margin: '60px 0', justifyContent: 'center' }}>
        <Button disabled={skinId === 1} onClick={() => setSkinId(skinId - 1)}>
          -
        </Button>
        <S.Text>{skinId}</S.Text>
        <InputNumber value={skinId} onChange={(value) => setSkinId(value)} />
        <Button onClick={() => setSkinId(skinId + 1)}>+</Button>
      </Horizontal>
      <Horizontal style={{ justifyContent: 'center' }}>
        <Radio.Group
          options={skinTypeOptions}
          value={skinType}
          buttonStyle="solid"
          onChange={(event) => setSkinType(event.target.value)}
        />
      </Horizontal>
      <S.Body>
        <Horizontal
          gap={
            numberSpace.data?.value !== undefined &&
            Number(numberSpace.data?.value) > 0
              ? Number(numberSpace.data?.value)
              : 0
          }
          style={{ justifyContent: 'center' }}
        >
          {renderDamage(criEffect)}
          {renderDamage(damage0)}
          {renderDamage(damage1)}
          {renderDamage(damage2)}
          {renderDamage(damage3)}
          {renderDamage(damage4)}
          {renderDamage(damage5)}
          {renderDamage(damage6)}
          {renderDamage(damage7)}
          {renderDamage(damage8)}
          {renderDamage(damage9)}
        </Horizontal>
        <Horizontal style={{ justifyContent: 'center' }}>
          {renderDamage(guard)}
          {renderDamage(Miss)}
          {renderDamage(resist)}
        </Horizontal>
        <Horizontal style={{ justifyContent: 'center' }}>
          <DamageSkin skinId={skinId} damage={993304} />
          <DamageSkin skinId={skinId} damage={300} isCritical />
        </Horizontal>
      </S.Body>
    </S.Container>
  )
}

export default App
