import Button from 'antd/lib/button'
import InputNumber from 'antd/lib/input-number'
import Radio from 'antd/lib/radio'
import React, { useEffect, useState } from 'react'
import { UseQueryResult } from 'react-query'
import { useGetDemageSkinAll, useGetWzImage } from './api/demage-skin'
import * as S from './appStyle'
import Horizontal from './components/Horizontal'
import useDamage from './hooks/useDemage'
import { GetDemageSkinResponse, SkinType } from './type/demage-skin'

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

  const demageAll = useGetDemageSkinAll({ skinId, skinType })
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
  } = useDamage({ skinId, skinType })

  const star = useGetWzImage()
  useEffect(() => {
    console.log(demageAll.data?.children)
  }, [demageAll.data])

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
          {renderDemage(criEffect)}
          {renderDemage(demage0)}
          {renderDemage(demage1)}
          {renderDemage(demage2)}
          {renderDemage(demage3)}
          {renderDemage(demage4)}
          {renderDemage(demage5)}
          {renderDemage(demage6)}
          {renderDemage(demage7)}
          {renderDemage(demage8)}
          {renderDemage(demage9)}
        </Horizontal>
        <Horizontal style={{ justifyContent: 'center' }}>
          {renderDemage(guard)}
          {renderDemage(Miss)}
          {renderDemage(resist)}
        </Horizontal>
      </S.Body>
    </S.Container>
  )
}

export default App
