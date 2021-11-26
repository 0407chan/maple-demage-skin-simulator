import React, { useEffect, useState } from 'react'
import ReactGA from 'react-ga'
import { v4 as uuid } from 'uuid'
import * as S from './appStyle'
import DamageSkin from './components/DamageSkin'
import Header from './components/Header'
import Horizontal from './components/Horizontal'
import { DamageType, ItemDto } from './type/damage-skin'
import { Setting } from './type/setting'

const hitImage = `${process.env.PUBLIC_URL}/images/hit1_0.png`
const standImage = `${process.env.PUBLIC_URL}/images/stand.gif`

const App: React.FC = () => {
  const [skinNumber, setSkinNumber] = useState<number>(287)
  const [damageList, setDamageList] = useState<DamageType[]>([])
  const [isAttacked, setIsAttacked] = useState<boolean>(false)
  const [currentSkin, setCurrentSkin] = useState<ItemDto>()
  const [setting, setSetting] = useState<Setting>({
    numberAttack: 1,
    maxDamage: 1000000,
    minDamage: 100000,
    criticalRate: 60
  })
  // const damageAll = useGetDamageSkinAll({ skinNumber, skinType })

  const onSetSkinNumber = (newId: number) => {
    setSkinNumber(newId)
    setDamageList([])
  }

  const onAttack = () => {
    setIsAttacked(true)
    const newDamageList: DamageType[] = []
    for (let index = 0; index < (setting.numberAttack || 0); index++) {
      const newDamage: DamageType = {
        id: uuid(),
        skinNumber,
        damage: getRandomInt({
          min: setting.minDamage || 0,
          max: setting.maxDamage || 0
        }),
        isCritical: Math.random() * 100 < (setting.criticalRate || 0)
      }
      newDamageList.push(newDamage)
    }
    setTimeout(() => {
      setIsAttacked(false)
    }, 1000)
    setDamageList([...damageList, ...newDamageList])
  }

  function getRandomInt({ min, max }: { min: number; max: number }) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min //최댓값은 제외, 최솟값은 포함
  }

  const initReactGA = () => {
    ReactGA.initialize('UA-178457189-3')
  }

  useEffect(() => {
    initReactGA()
  }, [])

  return (
    <S.Container>
      <S.Header>
        <Header
          {...{
            onSetSkinNumber,
            skinNumber,
            currentSkin,
            setCurrentSkin,
            setting,
            setSetting
          }}
        />
      </S.Header>
      <S.Body className="no-drag">
        <div style={{ height: '30%' }} />
        <Horizontal style={{ justifyContent: 'center' }}>
          {damageList.map((item) => (
            <DamageSkin
              key={item.id}
              damageItem={item}
              setDamageList={setDamageList}
              currentSkin={currentSkin}
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
