import React, { useState, useEffect } from 'react'
import { DamageType, ItemDto } from 'type/damage-skin'
import * as S from './style'
import { useRecoilValue } from 'recoil'
import { wzVersionState } from 'atoms/wzVersion'
import { formatDamageString } from './util'
import { getCachedBase64Image, loadBase64Image } from 'utils/base64ImageCache'

type Props = {
  damageItem: DamageType
  currentSkin?: ItemDto
}

const ApiImage: React.FC<{
  apiUrl: string
  style?: React.CSSProperties
}> = ({ apiUrl, style }) => {
  const [localSrc, setLocalSrc] = useState(
    () => getCachedBase64Image(apiUrl) ?? ''
  )

  useEffect(() => {
    const cachedImage = getCachedBase64Image(apiUrl)
    if (cachedImage) {
      setLocalSrc(cachedImage)
      return
    }

    let cancelled = false
    setLocalSrc('')

    loadBase64Image(apiUrl)
      .then((base64) => {
        if (!cancelled) setLocalSrc(base64)
      })
      .catch(() => {
        if (!cancelled) setLocalSrc('')
      })

    return () => {
      cancelled = true
    }
  }, [apiUrl])

  if (!localSrc) return null

  return (
    <img
      draggable={false}
      alt=""
      aria-hidden="true"
      src={localSrc}
      style={style}
    />
  )
}

const DamageSkin: React.FC<Props> = ({ damageItem, currentSkin }) => {
  const wzVersion = useRecoilValue(wzVersionState)

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
      aria-label={`${damageItem.isCritical ? '크리티컬 ' : ''}데미지 ${damageItem.damage.toLocaleString()}`}
      // stop = 멈춤
      // stop
    >
      {damageItem.isCritical && (
        <S.CriEffect>
          <ApiImage apiUrl={getCriticalImage()} />
        </S.CriEffect>
      )}
      {formatDamageString(damageItem.damage, isUnit() ?? false)
        .split('')
        .map((num, index) => (
          <ApiImage
            key={index}
            apiUrl={
              num === '만' || num === '억'
                ? getUnit(num as '만' | '억')
                : getSkinImage(Number(num), index === 0 ? 1 : 0)
            }
            style={{
              width: 'fit-content',
              height: 'fit-content',
              zIndex: index + 1,

              // 데미지 스킨의 자연스러운 지그재그를 위한 margin
              marginBottom: index % 2 === 0 ? 4 : 0,
              marginTop: index % 2 === 1 ? 4 : 0
            }}
          />
        ))}
    </S.Container>
  )
}

export default DamageSkin
