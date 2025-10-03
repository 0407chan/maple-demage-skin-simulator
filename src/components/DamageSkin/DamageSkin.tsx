import React, { useState, useEffect } from 'react'
import { DamageType, ItemDto } from 'type/damage-skin'
import * as S from './style'
import { useRecoilState, useRecoilValue } from 'recoil'
import { wzVersionState } from 'atoms/wzVersion'
import { imageCacheState } from 'atoms/imageCache'

type Props = {
  damageItem: DamageType
  currentSkin?: ItemDto
}

// API로부터 base64 이미지를 가져오는 함수
const fetchBase64Image = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url)
    const data = await response.json()
    return `data:image/png;base64,${data.value}`
  } catch (error) {
    console.error('Failed to fetch image:', error)
    return ''
  }
}

// API 이미지를 렌더링하는 컴포넌트 (컴포넌트 외부로 이동)
const ApiImage: React.FC<{
  apiUrl: string
  style?: React.CSSProperties
  alt: string
}> = ({ apiUrl, style, alt }) => {
  const [imageCache, setImageCache] = useRecoilState(imageCacheState)
  const [localSrc, setLocalSrc] = useState<string>('')

  useEffect(() => {
    // 이미 캐시에 있으면 사용
    if (imageCache[apiUrl]) {
      if (localSrc !== imageCache[apiUrl]) {
        setLocalSrc(imageCache[apiUrl])
      }
      return
    }

    // 이미 로컬에 있으면 스킵
    if (localSrc) return

    // 캐시에 없으면 직접 로드
    let cancelled = false
    fetchBase64Image(apiUrl).then((base64) => {
      if (!cancelled && base64) {
        setLocalSrc(base64)
        setImageCache((prev) => ({ ...prev, [apiUrl]: base64 }))
      }
    })

    return () => {
      cancelled = true
    }
  }, [apiUrl, imageCache, localSrc, setImageCache])

  // 캐시나 로컬에 이미지가 있으면 보여줌
  const src = imageCache[apiUrl] || localSrc
  if (!src) return null

  return <img draggable={false} alt={alt} src={src} style={style} />
}

const DamageSkin: React.FC<Props> = ({ damageItem, currentSkin }) => {
  const wzVersion = useRecoilValue(wzVersionState)

  // API URL 생성 함수들
  const getSkin1Image = (num: number) => {
    let newNum = num
    if (currentSkin?.name.includes('럭키세븐')) {
      newNum = 0
    }

    if (damageItem.isCritical) {
      return `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${damageItem.skinNumber}/NoCri1/${newNum}`
    } else {
      return `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${damageItem.skinNumber}/NoRed1/${newNum}`
    }
  }

  const getSkin0Image = (num: number) => {
    let newNum = num
    if (currentSkin?.name.includes('럭키세븐')) {
      newNum = 0
    }

    if (damageItem.isCritical) {
      return `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${damageItem.skinNumber}/NoCri0/${newNum}`
    } else {
      return `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${damageItem.skinNumber}/NoRed0/${newNum}`
    }

  }

  const isUnit = () => currentSkin?.name.includes('유닛')

  const getUnit = (unit: '만' | '억') => {
    const unitNum = unit === '만' ? 3 : 4

    if (damageItem.isCritical) {
      return `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${damageItem.skinNumber}/NoCustom/NoCri1/${unitNum}`
    } else {
      return `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${damageItem.skinNumber}/NoCustom/NoRed1/${unitNum}`
    }

  }

  const getCriticalImage = () => {
    return `https://maplestory.io/api/wz/${wzVersion.region}/${wzVersion.version}/Effect/DamageSkin.img/${damageItem.skinNumber}/NoCri1/effect3`
  }

  const getDamageString = () => {
    if (isUnit()) {
      const numString = `${damageItem.damage}`
      let result = ''
      if (numString.length <= 12 && numString.length > 8) {
        result += `${numString.slice(-12, -8)}억`
        if (Number(numString.slice(-8, -4)) > 0) {
          result += `${numString.slice(-8, -4)}만`
        }
        if (Number(numString.slice(-4)) > 0) {
          result += `${numString.slice(-4)}`
        }
      }
      // 만
      else if (numString.length <= 8 && numString.length > 4) {
        result += `${numString.slice(-8, -4)}만`
        if (Number(numString.slice(-4)) > 0) {
          result += `${numString.slice(-4)}`
        }
      } else {
        result += `${numString.slice(-4)}`
      }
      return result
    } else {
      return `${damageItem.damage}`
    }
  }

  return (
    <S.Container
      className="no-drag"
      delay={damageItem.level}
      style={{ bottom: damageItem.marginBottom }}
    // stop = 멈춤
    // stop
    >
      {damageItem.isCritical && (
        <S.CriEffect>
          <ApiImage apiUrl={getCriticalImage()} alt="critical-img" />
        </S.CriEffect>
      )}
      {getDamageString()
        .split('')
        .map((num, index) => (
          <ApiImage
            key={index}
            apiUrl={
              num === '만' || num === '억'
                ? getUnit(num as '만' | '억')
                : index === 0
                  ? getSkin1Image(Number(num))
                  : getSkin0Image(Number(num))
            }
            style={{
              width: 'fit-content',
              height: 'fit-content',
              zIndex: index + 1,

              // 데미지 스킨의 자연스러운 지그재그를 위한 margin
              marginBottom: index % 2 === 0 ? 4 : 0,
              marginTop: index % 2 === 1 ? 4 : 0
            }}
            alt={`skin-img-${num}-${index}`}
          />
        ))}
    </S.Container>
  )
}


export default DamageSkin
