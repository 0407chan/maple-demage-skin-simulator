import { useGetDamageSkin } from '@/api/damage-skin'
import { SkinType } from '@/type/damage-skin'

type UseDamageProps = {
  skinNumber: number
  skinType: SkinType
}
const useDamage = ({ skinNumber, skinType }: UseDamageProps) => {
  const damage0 = useGetDamageSkin({ skinNumber, skinType, damageNumber: '0' })
  const damage1 = useGetDamageSkin({ skinNumber, skinType, damageNumber: '1' })
  const damage2 = useGetDamageSkin({ skinNumber, skinType, damageNumber: '2' })
  const damage3 = useGetDamageSkin({ skinNumber, skinType, damageNumber: '3' })
  const damage4 = useGetDamageSkin({ skinNumber, skinType, damageNumber: '4' })
  const damage5 = useGetDamageSkin({ skinNumber, skinType, damageNumber: '5' })
  const damage6 = useGetDamageSkin({ skinNumber, skinType, damageNumber: '6' })
  const damage7 = useGetDamageSkin({ skinNumber, skinType, damageNumber: '7' })
  const damage8 = useGetDamageSkin({ skinNumber, skinType, damageNumber: '8' })
  const damage9 = useGetDamageSkin({ skinNumber, skinType, damageNumber: '9' })
  const numberSpace = useGetDamageSkin({
    skinNumber,
    skinType,
    damageNumber: 'numberSpace'
  })
  const guard = useGetDamageSkin({
    skinNumber,
    skinType: 'NoRed0',
    damageNumber: 'guard'
  })
  const Miss = useGetDamageSkin({
    skinNumber,
    skinType: 'NoRed0',
    damageNumber: 'Miss'
  })
  const resist = useGetDamageSkin({
    skinNumber,
    skinType: 'NoRed0',
    damageNumber: 'resist'
  })
  const criEffect = useGetDamageSkin({
    skinNumber,
    skinType: 'NoCri1',
    damageNumber: 'Effect3'
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
