import React, { useState } from 'react'
import { DamageType, ItemDto } from 'type/damage-skin'
import * as S from './style'
import { useRecoilValue } from 'recoil'
import { wzVersionState } from 'atoms/wzVersion'
import { formatDamageString } from './util'
import WzImage from './WzImage'
import { useI18n } from 'i18n'

type Props = {
  damageItem: DamageType
  currentSkin?: ItemDto
}

const DamageSkin: React.FC<Props> = ({ damageItem, currentSkin }) => {
  const { formatNumber, t } = useI18n()
  const wzVersion = useRecoilValue(wzVersionState)
  const [animationStart] = useState(() => performance.now())

  // wzVersion이 없으면 렌더링 안 함
  if (!wzVersion.version || !wzVersion.region) {
    return null
  }

  // 헬퍼 함수들
  const getBaseUrl = () => {
    return `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${damageItem.skinNumber}`
  }

  const getCriticalType = () => (damageItem.isCritical ? 'NoCri' : 'NoRed')

  const normalizeLuckySeven = (num: number) => {
    return currentSkin?.name.includes('럭키세븐') ? 0 : num
  }

  const isUnit = () => currentSkin?.name.includes('유닛')

  // API URL 생성 함수들
  const getSkinImage = (num: number, type: 0 | 1) => {
    const normalizedNum = normalizeLuckySeven(num)
    return `${getBaseUrl()}/${getCriticalType()}${type}/${normalizedNum}`
  }

  const getUnit = (unit: '만' | '억') => {
    const unitNum = unit === '만' ? 3 : 4
    return `${getBaseUrl()}/NoCustom/${getCriticalType()}1/${unitNum}`
  }

  const getCriticalImage = () => {
    return `${getBaseUrl()}/NoCri1/effect3`
  }

  return (
    <S.Container
      className="no-drag"
      $delay={damageItem.level}
      style={{ bottom: damageItem.marginBottom }}
      role="img"
      aria-label={t('damage.accessibleLabel', {
        critical: damageItem.isCritical ? t('damage.criticalPrefix') : '',
        damage: formatNumber(damageItem.damage)
      })}
      // stop = 멈춤
      // stop
    >
      {formatDamageString(damageItem.damage, isUnit() ?? false)
        .split('')
        .map((num, index) => (
          <S.Digit
            key={`${index}-${num}`}
            style={{
              zIndex: index + 1,
              // 데미지 스킨의 자연스러운 지그재그를 위한 margin
              marginBottom: index % 2 === 0 ? 4 : 0,
              marginTop: index % 2 === 1 ? 4 : 0
            }}
          >
            {damageItem.isCritical && index === 0 && (
              <S.CriEffect>
                <WzImage
                  apiUrl={getCriticalImage()}
                  animationStart={animationStart}
                  anchored
                />
              </S.CriEffect>
            )}
            <WzImage
              apiUrl={
                num === '만' || num === '억'
                  ? getUnit(num as '만' | '억')
                  : getSkinImage(Number(num), index === 0 ? 1 : 0)
              }
              animationStart={animationStart}
            />
          </S.Digit>
        ))}
    </S.Container>
  )
}

export default DamageSkin
