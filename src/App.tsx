import React, { useEffect, useState } from 'react'
import ReactGA from 'react-ga4'
import { useRecoilState } from 'recoil'
import { v4 as uuid } from 'uuid'
// 이미지 임포트
import hitImage from 'images/hit1_0.png'
import standImage from 'images/stand.gif'
import { useGetWzVersion } from './api/damage-skin'
import * as S from './appStyle'
import { wzVersionState } from './atoms/wzVersion'
import DamageWrapper from './components/DamageWrapper'
import Header from './components/Header'
import { useImageLoader } from './hooks/useImageLoader'
import { DamageType, DamageWrapperType, ItemDto } from './type/damage-skin'
import { Setting } from './type/setting'

const REGION = 'KMST'

export interface AppState {
  skinNumber: number;
  damageWrapperList: DamageWrapperType[];
  isAttacked: boolean;
  currentSkin?: ItemDto;
  setting: Setting;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    skinNumber: 287,
    damageWrapperList: [],
    isAttacked: false,
    currentSkin: undefined,
    setting: {
      numberAttack: 5,
      maxDamage: 1000000,
      minDamage: 100000,
      criticalRate: 60
    }
  });

  const { criticalHeight, normalHeight } = useImageLoader(state.skinNumber);

  const [_, setWzVersion] = useRecoilState(wzVersionState)

  useGetWzVersion({
    options: {
      onSuccess(data) {
        const version = data
          .filter((item) => item.region === REGION)
          .at(-1)?.mapleVersionId

        console.log(`current version: ${REGION}`, version)

        if (version !== undefined) {
          setWzVersion(Number(version))
        }
      }
    }
  })

  const onSetSkinNumber = (newId: number) => {
    setState(prevState => ({
      ...prevState,
      skinNumber: newId,
      damageWrapperList: []
    }));
  };

  const onAttack = () => {
    ReactGA.event({
      category: 'button_click',
      action: 'attack_mushroom',
      value: 1
    })
    const newDamageWrapper: DamageWrapperType = {
      id: uuid(),
      damageList: []
    }
    const newDamageList: DamageType[] = []
    let totalHeight = 0
    for (let index = 0; index < (state.setting.numberAttack || 0); index++) {
      const newDamage: DamageType = {
        id: uuid(),
        skinNumber: state.skinNumber,
        level: index,
        marginBottom: totalHeight,
        damage: getRandomInt({
          min: state.setting.minDamage || 0,
          max: state.setting.maxDamage || 0
        }),
        isCritical: Math.random() * 100 < (state.setting.criticalRate || 0)
      }
      totalHeight += newDamage.isCritical ? criticalHeight : normalHeight
      newDamageList.push(newDamage)
    }
    setState(prevState => ({
      ...prevState,
      isAttacked: true,
      damageWrapperList: [
        ...prevState.damageWrapperList,
        { ...newDamageWrapper, damageList: newDamageList }
      ]
    }));
  }

  useEffect(() => {
    if (state.isAttacked) {
      const timer = setTimeout(() => {
        setState(prevState => ({ ...prevState, isAttacked: false }));
      }, 1000);

      // 정리 함수 반환
      return () => {
        clearTimeout(timer);
      };
    }
  }, [state.isAttacked]);

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
    setState(prevState => ({
      ...prevState,
      criticalHeight,
      normalHeight
    }));
  }, [criticalHeight, normalHeight])

  return (
    <S.Container>
      <S.Header>
        <Header
          onSetSkinNumber={onSetSkinNumber}
          currentSkin={state.currentSkin}
          setCurrentSkin={(skin?: ItemDto) => setState(prevState => ({ ...prevState, currentSkin: skin }))}
          setting={state.setting}
          setSetting={(newSetting: Setting) => setState(prevState => ({ ...prevState, setting: newSetting }))}
          skinNumber={state.skinNumber}
        />
      </S.Header>
      <S.Body className="no-drag">
        <div style={{ height: '30%' }} />
        {state.damageWrapperList.map((item) => (
          <DamageWrapper
            key={item.id}
            damageWrapper={item}
            setState={setState}
            currentSkin={state.currentSkin}
          />
        ))}
        <S.OrangeMushroom
          draggable="false"
          src={state.isAttacked ? hitImage : standImage}
          alt="orange-mushroom"
          onClick={() => onAttack()}
        />
      </S.Body>
    </S.Container>
  )
}

export default App
