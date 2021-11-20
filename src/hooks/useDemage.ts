import { useGetDemageSkin } from '@/api/demage-skin'
import { SkinType } from '@/type/demage-skin'

type UseDamageProps = {
  skinId: number
  skinType: SkinType
}
const useDamage = ({ skinId, skinType }: UseDamageProps) => {
  const demage0 = useGetDemageSkin({ skinId, skinType, skinNumber: '0' })
  const demage1 = useGetDemageSkin({ skinId, skinType, skinNumber: '1' })
  const demage2 = useGetDemageSkin({ skinId, skinType, skinNumber: '2' })
  const demage3 = useGetDemageSkin({ skinId, skinType, skinNumber: '3' })
  const demage4 = useGetDemageSkin({ skinId, skinType, skinNumber: '4' })
  const demage5 = useGetDemageSkin({ skinId, skinType, skinNumber: '5' })
  const demage6 = useGetDemageSkin({ skinId, skinType, skinNumber: '6' })
  const demage7 = useGetDemageSkin({ skinId, skinType, skinNumber: '7' })
  const demage8 = useGetDemageSkin({ skinId, skinType, skinNumber: '8' })
  const demage9 = useGetDemageSkin({ skinId, skinType, skinNumber: '9' })
  const numberSpace = useGetDemageSkin({
    skinId,
    skinType,
    skinNumber: 'numberSpace'
  })
  const guard = useGetDemageSkin({
    skinId,
    skinType: 'NoRed0',
    skinNumber: 'guard'
  })
  const Miss = useGetDemageSkin({
    skinId,
    skinType: 'NoRed0',
    skinNumber: 'Miss'
  })
  const resist = useGetDemageSkin({
    skinId,
    skinType: 'NoRed0',
    skinNumber: 'resist'
  })
  const criEffect = useGetDemageSkin({
    skinId,
    skinType: 'NoCri1',
    skinNumber: 'Effect3'
  })
  return {
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
    numberSpace,
    guard,
    Miss,
    resist,
    criEffect
  }
}

export default useDamage
