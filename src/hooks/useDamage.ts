import { useGetDamageSkin } from '@/api/damage-skin'
import { SkinType } from '@/type/damage-skin'

type UseDamageProps = {
  skinId: number
  skinType: SkinType
}
const useDamage = ({ skinId, skinType }: UseDamageProps) => {
  const damage0 = useGetDamageSkin({ skinId, skinType, skinNumber: '0' })
  const damage1 = useGetDamageSkin({ skinId, skinType, skinNumber: '1' })
  const damage2 = useGetDamageSkin({ skinId, skinType, skinNumber: '2' })
  const damage3 = useGetDamageSkin({ skinId, skinType, skinNumber: '3' })
  const damage4 = useGetDamageSkin({ skinId, skinType, skinNumber: '4' })
  const damage5 = useGetDamageSkin({ skinId, skinType, skinNumber: '5' })
  const damage6 = useGetDamageSkin({ skinId, skinType, skinNumber: '6' })
  const damage7 = useGetDamageSkin({ skinId, skinType, skinNumber: '7' })
  const damage8 = useGetDamageSkin({ skinId, skinType, skinNumber: '8' })
  const damage9 = useGetDamageSkin({ skinId, skinType, skinNumber: '9' })
  const numberSpace = useGetDamageSkin({
    skinId,
    skinType,
    skinNumber: 'numberSpace'
  })
  const guard = useGetDamageSkin({
    skinId,
    skinType: 'NoRed0',
    skinNumber: 'guard'
  })
  const Miss = useGetDamageSkin({
    skinId,
    skinType: 'NoRed0',
    skinNumber: 'Miss'
  })
  const resist = useGetDamageSkin({
    skinId,
    skinType: 'NoRed0',
    skinNumber: 'resist'
  })
  const criEffect = useGetDamageSkin({
    skinId,
    skinType: 'NoCri1',
    skinNumber: 'Effect3'
  })
  return {
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
    numberSpace,
    guard,
    Miss,
    resist,
    criEffect
  }
}

export default useDamage
