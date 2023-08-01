import React, { useEffect, useState } from 'react'
import ReactGA from 'react-ga4'
import { useRecoilState } from 'recoil'
import { v4 as uuid } from 'uuid'
import { useGetWzVersion } from './api/damage-skin'
import * as S from './appStyle'
import { wzVersionState } from './atoms/wzVersion'
import DamageWrapper from './components/DamageWrapper'
import Header from './components/Header'
import { DamageType, DamageWrapperType, ItemDto } from './type/damage-skin'
import { Setting } from './type/setting'

const hitImage = `./images/hit1_0.png`
const standImage = `./images/stand.gif`

const App: React.FC = () => {
  const [skinNumber, setSkinNumber] = useState<number>(287)
  const [damageWrapperList, setDamageWrapperList] = useState<
    DamageWrapperType[]
  >([])

  const [_, setWzVersion] = useRecoilState(wzVersionState)

  useGetWzVersion({
    options: {
      onSuccess(data) {
        const version = data
          .filter((item) => item.region === 'KMST')
          .at(-1)?.mapleVersionId

        console.log('current version: KMST', version)

        if (version !== undefined) {
          setWzVersion(Number(version))
        }
      }
    }
  })

  const [isAttacked, setIsAttacked] = useState<boolean>(false)
  const [currentSkin, setCurrentSkin] = useState<ItemDto>()
  const [criticalHeight, setCriticalHeight] = useState<number>(0)
  const [normalHeight, setNormalHeight] = useState<number>(0)

  const [setting, setSetting] = useState<Setting>({
    numberAttack: 5,
    maxDamage: 1000000,
    minDamage: 100000,
    criticalRate: 60
  })

  const onSetSkinNumber = (newId: number) => {
    setSkinNumber(newId)
    setDamageWrapperList([])
  }

  const onAttack = () => {
    ReactGA.event({
      category: 'button_click',
      action: 'attack_mushroom',
      value: 1
    })
    setIsAttacked(true)
    const newDamageWrapper: DamageWrapperType = {
      id: uuid(),
      damageList: []
    }
    const newDamageList: DamageType[] = []
    let totalHeight = 0
    for (let index = 0; index < (setting.numberAttack || 0); index++) {
      const newDamage: DamageType = {
        id: uuid(),
        skinNumber,
        level: index,
        marginBottom: totalHeight,
        damage: getRandomInt({
          min: setting.minDamage || 0,
          max: setting.maxDamage || 0
        }),
        isCritical: Math.random() * 100 < (setting.criticalRate || 0)
      }
      totalHeight += newDamage.isCritical ? criticalHeight : normalHeight
      newDamageList.push(newDamage)
    }
    setTimeout(() => {
      setIsAttacked(false)
    }, 1000)
    setDamageWrapperList([
      ...damageWrapperList,
      { ...newDamageWrapper, damageList: newDamageList }
    ])
  }

  function getRandomInt({ min, max }: { min: number; max: number }) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min //최댓값은 제외, 최솟값은 포함
  }

  const initReactGA = () => {
    ReactGA.initialize(import.meta.env.VITE_ID || '')
  }

  useEffect(() => {
    initReactGA()
  }, [])

  useEffect(() => {
    const criImg: HTMLImageElement = new Image()
    const normalImg: HTMLImageElement = new Image()
    criImg.src = `./images/export/Effect-DamageSkin.img-${skinNumber}-NoCri1-1.png`
    normalImg.src = `./images/export/Effect-DamageSkin.img-${skinNumber}-NoRed1-1.png`
    criImg.onload = function () {
      setCriticalHeight(criImg.height - 10)
    }
    normalImg.onload = function () {
      setNormalHeight(normalImg.height - 5)
    }
  }, [skinNumber])

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
        {damageWrapperList.map((item) => (
          <DamageWrapper
            key={item.id}
            damageWrapper={item}
            setDamageWrapperList={setDamageWrapperList}
            currentSkin={currentSkin}
          />
        ))}
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
