import ReactGA from 'react-ga4'
import { ItemDto } from 'type/damage-skin'
import { Monster } from 'type/monster'
import { Setting } from 'type/setting'

export const ANALYTICS_EVENT_NAMES = {
  SELECTOR_OPENED: '선택창_열기',
  MONSTER_SELECTED: '몬스터_선택',
  DAMAGE_SKIN_SELECTED: '데미지_스킨_선택',
  DAMAGE_SETTING_CHANGED: '데미지_설정_변경',
  MONSTER_ATTACKED: '몬스터_공격'
} as const

export type SkinAnalyticsType = '액션' | '유닛' | '일반'
export type SkinFilterName = '전체' | '유닛' | '액션'
export type SelectorType = '몬스터' | '데미지_스킨'

type AnalyticsParameter = string | number
type AnalyticsParameters = Record<string, AnalyticsParameter | undefined>

type WzContext = {
  region?: string
  version?: number
}

let analyticsInitialized = false

const getWzParameters = ({ region, version }: WzContext) => ({
  wz_region: region,
  wz_version: version?.toString()
})

const compactParameters = (parameters: AnalyticsParameters) =>
  Object.fromEntries(
    Object.entries(parameters).filter(
      (entry): entry is [string, AnalyticsParameter] => {
        const value = entry[1]
        return value !== undefined && value !== ''
      }
    )
  )

const sendEvent = (
  eventName: (typeof ANALYTICS_EVENT_NAMES)[keyof typeof ANALYTICS_EVENT_NAMES],
  parameters: AnalyticsParameters
) => {
  if (!analyticsInitialized) return
  ReactGA.event(eventName, compactParameters(parameters))
}

export const initializeAnalytics = () => {
  if (analyticsInitialized) return true

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()
  const debugMode = import.meta.env.VITE_GA_DEBUG === 'true'

  if (!measurementId || (!import.meta.env.PROD && !debugMode)) return false

  if (!/^G-[A-Z0-9]+$/.test(measurementId)) {
    console.warn('GA4 측정 ID 형식이 올바르지 않아 분석을 시작하지 않습니다.')
    return false
  }

  ReactGA.initialize(measurementId, {
    gtagOptions: {
      send_page_view: true,
      ...(debugMode ? { debug_mode: true } : {})
    }
  })
  analyticsInitialized = true
  return true
}

export const getSkinAnalyticsType = (skin: ItemDto): SkinAnalyticsType => {
  if (skin.name.includes('액션 데미지 스킨')) return '액션'
  if (skin.name.includes('유닛')) return '유닛'
  return '일반'
}

export const trackSelectorOpened = ({
  selectorType,
  currentItemId,
  currentItemName,
  region,
  version
}: {
  selectorType: SelectorType
  currentItemId?: number
  currentItemName?: string
} & WzContext) => {
  sendEvent(ANALYTICS_EVENT_NAMES.SELECTOR_OPENED, {
    selection_type: selectorType,
    current_item_id: currentItemId?.toString(),
    current_item_name: currentItemName,
    ...getWzParameters({ region, version })
  })
}

export const trackMonsterSelected = ({
  monster,
  previousMonster,
  searchTerm,
  searchResultCount,
  region,
  version
}: {
  monster: Monster
  previousMonster: Monster
  searchTerm: string
  searchResultCount: number
} & WzContext) => {
  const normalizedSearchTerm = searchTerm.trim()

  sendEvent(ANALYTICS_EVENT_NAMES.MONSTER_SELECTED, {
    monster_id: monster.id.toString(),
    monster_name: monster.name,
    monster_level: monster.level,
    monster_category: monster.isBoss ? '보스' : '일반',
    monster_type: monster.mobType,
    previous_monster_id: previousMonster.id.toString(),
    previous_monster_name: previousMonster.name,
    selection_changed: monster.id === previousMonster.id ? '아니오' : '예',
    search_used: normalizedSearchTerm ? '예' : '아니오',
    search_result_count: searchResultCount,
    ...getWzParameters({ region, version })
  })
}

export const trackDamageSkinSelected = ({
  skin,
  skinEffectId,
  skinVariantCount,
  previousSkin,
  filter,
  searchTerm,
  searchResultCount,
  region,
  version
}: {
  skin: ItemDto
  skinEffectId: number
  skinVariantCount: number
  previousSkin?: ItemDto
  filter: SkinFilterName
  searchTerm: string
  searchResultCount: number
} & WzContext) => {
  const normalizedSearchTerm = searchTerm.trim()

  sendEvent(ANALYTICS_EVENT_NAMES.DAMAGE_SKIN_SELECTED, {
    skin_item_id: skin.id.toString(),
    skin_name: skin.name,
    skin_effect_id: skinEffectId.toString(),
    skin_type: getSkinAnalyticsType(skin),
    skin_variant_count: skinVariantCount,
    previous_skin_item_id: previousSkin?.id.toString(),
    previous_skin_name: previousSkin?.name,
    selection_changed: skin.id === previousSkin?.id ? '아니오' : '예',
    skin_filter: filter,
    search_used: normalizedSearchTerm ? '예' : '아니오',
    search_result_count: searchResultCount,
    ...getWzParameters({ region, version })
  })
}

const SETTING_FIELD_NAMES: Record<keyof Setting, string> = {
  minDamage: '최소_데미지',
  maxDamage: '최대_데미지',
  criticalRate: '크리티컬_확률',
  numberAttack: '공격_타수',
  monsterInvincible: '몬스터_무적_모드'
}

export const getChangedSettingFields = (
  previousSetting: Setting,
  setting: Setting
) =>
  (Object.keys(SETTING_FIELD_NAMES) as Array<keyof Setting>)
    .filter((key) => previousSetting[key] !== setting[key])
    .map((key) => SETTING_FIELD_NAMES[key])

export const trackDamageSettingChanged = (
  previousSetting: Setting,
  setting: Setting
) => {
  const changedFields = getChangedSettingFields(previousSetting, setting)
  if (changedFields.length === 0) return

  sendEvent(ANALYTICS_EVENT_NAMES.DAMAGE_SETTING_CHANGED, {
    changed_fields: changedFields.join(','),
    minimum_damage: setting.minDamage,
    maximum_damage: setting.maxDamage,
    critical_rate: setting.criticalRate,
    attack_count: setting.numberAttack,
    monster_invincible: setting.monsterInvincible === false ? '아니오' : '예'
  })
}

export const trackMonsterAttacked = ({
  monster,
  skin,
  skinEffectId,
  skinVariantCount,
  setting,
  region,
  version
}: {
  monster: Monster
  skin?: ItemDto
  skinEffectId: number
  skinVariantCount: number
  setting: Setting
} & WzContext) => {
  sendEvent(ANALYTICS_EVENT_NAMES.MONSTER_ATTACKED, {
    monster_id: monster.id.toString(),
    monster_name: monster.name,
    monster_level: monster.level,
    monster_category: monster.isBoss ? '보스' : '일반',
    monster_type: monster.mobType,
    skin_item_id: skin?.id.toString(),
    skin_name: skin?.name,
    skin_effect_id: skinEffectId.toString(),
    skin_type: skin ? getSkinAnalyticsType(skin) : undefined,
    skin_variant_count: skinVariantCount,
    minimum_damage: setting.minDamage,
    maximum_damage: setting.maxDamage,
    critical_rate: setting.criticalRate,
    attack_count: setting.numberAttack,
    monster_invincible: setting.monsterInvincible === false ? '아니오' : '예',
    ...getWzParameters({ region, version })
  })
}
