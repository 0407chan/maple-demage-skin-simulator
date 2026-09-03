import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

export type Locale = 'ko' | 'en' | 'ja' | 'zh-CN'
export type LocalePreference = 'auto' | Locale

const LOCALE_STORAGE_KEY = 'mapleSimulatorLocale'

const korean = {
  'app.title': '뎀스 시뮬레이터',
  'app.description': '메이플스토리 데미지 스킨을 미리 체험해 보세요.',
  'app.mapping.open': '로컬 매핑 도구 열기',
  'app.mapping.label': '매핑 도구',
  'app.monster.health': '{name} 체력',
  'app.monster.attack': '{name} 공격하기',
  'app.monster.dying': '{name} 쓰러지는 중',
  'app.monster.respawning': '{name} 다시 나타나는 중',
  'common.clearSearch': '검색어 지우기',
  'common.retry': '다시 시도',
  'common.searchResults': '검색 결과 {count}개',
  'common.noResults': '검색 결과가 없어요.',
  'common.count': '{count}개',
  'settings.trigger': '세팅',
  'settings.title': '데미지 설정',
  'settings.description': '전투 수치를 조정하고 결과를 바로 확인해 보세요.',
  'settings.close': '설정 닫기',
  'settings.language': '표시 언어',
  'settings.languageDescription':
    '처음에는 브라우저 언어를 따르고, 직접 고른 언어는 저장됩니다.',
  'settings.languageLabel': '표시 언어 선택',
  'settings.languageAuto': '자동 (브라우저)',
  'settings.damageRange': '데미지 범위',
  'settings.damageRangeDescription': '공격 한 번에 표시될 최소·최대 수치',
  'settings.minDamage': '최소 데미지',
  'settings.maxDamage': '최대 데미지',
  'settings.critical': '크리티컬',
  'settings.criticalDescription': '치명타가 발생할 확률',
  'settings.criticalDecrease': '크리티컬 확률 10% 감소',
  'settings.criticalRate': '크리티컬 확률',
  'settings.criticalIncrease': '크리티컬 확률 10% 증가',
  'settings.hitCount': '공격 타수',
  'settings.hitCountDescription': '한 번에 표시할 데미지 수',
  'settings.hitCountDecrease': '공격 타수 1 감소',
  'settings.hitCountLabel': '공격 타수',
  'settings.hitCountUnit': '회',
  'settings.hitCountIncrease': '공격 타수 1 증가',
  'settings.invincible': '몬스터 무적모드',
  'settings.invincibleDescription': '체력 감소와 처치·리스폰을 막습니다.',
  'settings.autoSave': '변경한 설정은 자동으로 저장됩니다.',
  'monster.changeCurrent': '몬스터 변경: 현재 {name}',
  'monster.title': '몬스터 변경',
  'monster.description': '이름으로 검색한 뒤 공격할 몬스터를 골라보세요.',
  'monster.close': '몬스터 변경 닫기',
  'monster.placeholder': '예: 슬라임, 주황버섯, 루시드',
  'monster.searchLabel': '몬스터 검색',
  'monster.searching': '몬스터를 찾는 중이에요.',
  'monster.currentTarget': '현재 공격 대상',
  'monster.loading': '몬스터를 불러오고 있어요.',
  'monster.error': '몬스터를 불러오지 못했어요.',
  'monster.emptyHint': '다른 몬스터 이름으로 찾아보세요.',
  'background.default': '기본 배경',
  'background.changeCurrent': '배경 변경: 현재 {name}',
  'background.title': '배경 변경',
  'background.description': '맵 이름으로 검색한 뒤 전투 배경을 골라보세요.',
  'background.close': '배경 변경 닫기',
  'background.placeholder': '예: 헤네시스, 리스항구, 루디브리엄',
  'background.searchLabel': '맵 검색',
  'background.searching': '맵을 찾는 중이에요.',
  'background.current': '현재 배경',
  'background.defaultDescription': '단색 배경으로 돌아가기',
  'background.loading': '맵을 불러오고 있어요.',
  'background.error': '맵을 불러오지 못했어요.',
  'background.emptyHint': '다른 맵 이름으로 찾아보세요.',
  'background.mapNumber': '맵 #{id}',
  'skin.selectCurrent': '데미지 스킨 선택: {name}',
  'skin.title': '데미지 스킨 선택',
  'skin.description': '원하는 스킨을 검색하고 바로 적용해 보세요.',
  'skin.close': '데미지 스킨 선택 닫기',
  'skin.placeholder': '스킨 이름 검색',
  'skin.searchLabel': '데미지 스킨 검색',
  'skin.filterLabel': '스킨 유형 필터',
  'skin.filter.all': '전체',
  'skin.filter.unit': '유닛',
  'skin.filter.action': '액션',
  'skin.current': '현재 적용 중',
  'skin.applied': '적용됨',
  'skin.list': '스킨 목록',
  'skin.loadingShort': '불러오는 중',
  'skin.loading': '스킨을 불러오고 있어요.',
  'skin.emptyHint': '다른 이름이나 필터로 다시 찾아보세요.',
  'damage.accessibleLabel': '{critical}데미지 {damage}',
  'damage.criticalPrefix': '크리티컬 ',
  'map.navigation': '맵 탐색'
} as const

type TranslationKey = keyof typeof korean
type TranslationParams = Record<string, string | number>
type TranslationTable = Record<TranslationKey, string>

const english: TranslationTable = {
  'app.title': 'MapleStory Damage Skin Simulator',
  'app.description':
    'Preview MapleStory damage skins in an interactive simulator.',
  'app.mapping.open': 'Open the local mapping tool',
  'app.mapping.label': 'Mapping tool',
  'app.monster.health': '{name} health',
  'app.monster.attack': 'Attack {name}',
  'app.monster.dying': '{name} is being defeated',
  'app.monster.respawning': '{name} is respawning',
  'common.clearSearch': 'Clear search',
  'common.retry': 'Try again',
  'common.searchResults': '{count} results',
  'common.noResults': 'No results found.',
  'common.count': '{count}',
  'settings.trigger': 'Settings',
  'settings.title': 'Damage settings',
  'settings.description': 'Tune combat values and see the result immediately.',
  'settings.close': 'Close settings',
  'settings.language': 'Display language',
  'settings.languageDescription':
    'Uses your browser language at first and remembers your selection.',
  'settings.languageLabel': 'Choose display language',
  'settings.languageAuto': 'Automatic (browser)',
  'settings.damageRange': 'Damage range',
  'settings.damageRangeDescription': 'Minimum and maximum values shown per hit',
  'settings.minDamage': 'Minimum damage',
  'settings.maxDamage': 'Maximum damage',
  'settings.critical': 'Critical hit',
  'settings.criticalDescription': 'Chance for a critical hit',
  'settings.criticalDecrease': 'Decrease critical chance by 10%',
  'settings.criticalRate': 'Critical chance',
  'settings.criticalIncrease': 'Increase critical chance by 10%',
  'settings.hitCount': 'Hit count',
  'settings.hitCountDescription': 'Damage lines shown per attack',
  'settings.hitCountDecrease': 'Decrease hit count by 1',
  'settings.hitCountLabel': 'Hit count',
  'settings.hitCountUnit': 'hits',
  'settings.hitCountIncrease': 'Increase hit count by 1',
  'settings.invincible': 'Monster invincibility',
  'settings.invincibleDescription':
    'Prevents health loss, defeat, and respawn.',
  'settings.autoSave': 'Changes are saved automatically.',
  'monster.changeCurrent': 'Change monster. Current: {name}',
  'monster.title': 'Change monster',
  'monster.description':
    'Search by Korean name and choose a monster to attack.',
  'monster.close': 'Close monster selection',
  'monster.placeholder': 'e.g. 슬라임, 주황버섯, 루시드',
  'monster.searchLabel': 'Search monsters',
  'monster.searching': 'Searching for monsters…',
  'monster.currentTarget': 'Current target',
  'monster.loading': 'Loading monsters…',
  'monster.error': 'Could not load monsters.',
  'monster.emptyHint': 'Try another Korean monster name.',
  'background.default': 'Default background',
  'background.changeCurrent': 'Change background. Current: {name}',
  'background.title': 'Change background',
  'background.description':
    'Search by Korean map name and choose a battle background.',
  'background.close': 'Close background selection',
  'background.placeholder': 'e.g. 헤네시스, 리스항구, 루디브리엄',
  'background.searchLabel': 'Search maps',
  'background.searching': 'Searching for maps…',
  'background.current': 'Current background',
  'background.defaultDescription': 'Return to the solid-color background',
  'background.loading': 'Loading maps…',
  'background.error': 'Could not load maps.',
  'background.emptyHint': 'Try another Korean map name.',
  'background.mapNumber': 'Map #{id}',
  'skin.selectCurrent': 'Select damage skin. Current: {name}',
  'skin.title': 'Select a damage skin',
  'skin.description': 'Search for a skin and apply it instantly.',
  'skin.close': 'Close damage skin selection',
  'skin.placeholder': 'Search skin names',
  'skin.searchLabel': 'Search damage skins',
  'skin.filterLabel': 'Filter skin types',
  'skin.filter.all': 'All',
  'skin.filter.unit': 'Unit',
  'skin.filter.action': 'Action',
  'skin.current': 'Currently applied',
  'skin.applied': 'Applied',
  'skin.list': 'Skin list',
  'skin.loadingShort': 'Loading',
  'skin.loading': 'Loading damage skins…',
  'skin.emptyHint': 'Try another Korean name or filter.',
  'damage.accessibleLabel': '{critical}damage {damage}',
  'damage.criticalPrefix': 'Critical ',
  'map.navigation': 'Explore map'
}

const japanese: TranslationTable = {
  'app.title': 'ダメージスキンシミュレーター',
  'app.description': 'メイプルストーリーのダメージスキンを試せます。',
  'app.mapping.open': 'ローカルマッピングツールを開く',
  'app.mapping.label': 'マッピングツール',
  'app.monster.health': '{name}のHP',
  'app.monster.attack': '{name}を攻撃',
  'app.monster.dying': '{name}を撃破中',
  'app.monster.respawning': '{name}が再出現中',
  'common.clearSearch': '検索をクリア',
  'common.retry': '再試行',
  'common.searchResults': '検索結果 {count}件',
  'common.noResults': '検索結果がありません。',
  'common.count': '{count}件',
  'settings.trigger': '設定',
  'settings.title': 'ダメージ設定',
  'settings.description': '戦闘数値を調整し、結果をすぐに確認できます。',
  'settings.close': '設定を閉じる',
  'settings.language': '表示言語',
  'settings.languageDescription':
    '初回はブラウザの言語を使用し、選んだ言語は保存されます。',
  'settings.languageLabel': '表示言語を選択',
  'settings.languageAuto': '自動（ブラウザ）',
  'settings.damageRange': 'ダメージ範囲',
  'settings.damageRangeDescription': '1回の攻撃で表示される最小・最大値',
  'settings.minDamage': '最小ダメージ',
  'settings.maxDamage': '最大ダメージ',
  'settings.critical': 'クリティカル',
  'settings.criticalDescription': 'クリティカルが発生する確率',
  'settings.criticalDecrease': 'クリティカル率を10%下げる',
  'settings.criticalRate': 'クリティカル率',
  'settings.criticalIncrease': 'クリティカル率を10%上げる',
  'settings.hitCount': 'ヒット数',
  'settings.hitCountDescription': '1回に表示するダメージの数',
  'settings.hitCountDecrease': 'ヒット数を1減らす',
  'settings.hitCountLabel': 'ヒット数',
  'settings.hitCountUnit': '回',
  'settings.hitCountIncrease': 'ヒット数を1増やす',
  'settings.invincible': 'モンスター無敵モード',
  'settings.invincibleDescription': 'HP減少、撃破、再出現を無効にします。',
  'settings.autoSave': '変更した設定は自動的に保存されます。',
  'monster.changeCurrent': 'モンスター変更：現在 {name}',
  'monster.title': 'モンスター変更',
  'monster.description':
    '韓国語の名前で検索し、攻撃するモンスターを選んでください。',
  'monster.close': 'モンスター選択を閉じる',
  'monster.placeholder': '例：슬라임、주황버섯、루시드',
  'monster.searchLabel': 'モンスター検索',
  'monster.searching': 'モンスターを検索中…',
  'monster.currentTarget': '現在の攻撃対象',
  'monster.loading': 'モンスターを読み込み中…',
  'monster.error': 'モンスターを読み込めませんでした。',
  'monster.emptyHint': '別の韓国語モンスター名で検索してください。',
  'background.default': 'デフォルト背景',
  'background.changeCurrent': '背景変更：現在 {name}',
  'background.title': '背景変更',
  'background.description':
    '韓国語のマップ名で検索し、戦闘背景を選んでください。',
  'background.close': '背景選択を閉じる',
  'background.placeholder': '例：헤네시스、리스항구、루디브리엄',
  'background.searchLabel': 'マップ検索',
  'background.searching': 'マップを検索中…',
  'background.current': '現在の背景',
  'background.defaultDescription': '単色の背景に戻す',
  'background.loading': 'マップを読み込み中…',
  'background.error': 'マップを読み込めませんでした。',
  'background.emptyHint': '別の韓国語マップ名で検索してください。',
  'background.mapNumber': 'マップ #{id}',
  'skin.selectCurrent': 'ダメージスキン選択：現在 {name}',
  'skin.title': 'ダメージスキン選択',
  'skin.description': 'スキンを検索してすぐに適用できます。',
  'skin.close': 'ダメージスキン選択を閉じる',
  'skin.placeholder': 'スキン名を検索',
  'skin.searchLabel': 'ダメージスキン検索',
  'skin.filterLabel': 'スキンタイプの絞り込み',
  'skin.filter.all': 'すべて',
  'skin.filter.unit': 'ユニット',
  'skin.filter.action': 'アクション',
  'skin.current': '現在適用中',
  'skin.applied': '適用中',
  'skin.list': 'スキン一覧',
  'skin.loadingShort': '読み込み中',
  'skin.loading': 'スキンを読み込み中…',
  'skin.emptyHint': '別の韓国語名またはフィルターをお試しください。',
  'damage.accessibleLabel': '{critical}ダメージ {damage}',
  'damage.criticalPrefix': 'クリティカル ',
  'map.navigation': 'マップ探索'
}

const simplifiedChinese: TranslationTable = {
  'app.title': '伤害皮肤模拟器',
  'app.description': '在互动模拟器中预览冒险岛伤害皮肤。',
  'app.mapping.open': '打开本地映射工具',
  'app.mapping.label': '映射工具',
  'app.monster.health': '{name}的生命值',
  'app.monster.attack': '攻击{name}',
  'app.monster.dying': '正在击败{name}',
  'app.monster.respawning': '{name}正在重生',
  'common.clearSearch': '清除搜索',
  'common.retry': '重试',
  'common.searchResults': '搜索结果 {count} 个',
  'common.noResults': '没有搜索结果。',
  'common.count': '{count} 个',
  'settings.trigger': '设置',
  'settings.title': '伤害设置',
  'settings.description': '调整战斗数值并立即查看结果。',
  'settings.close': '关闭设置',
  'settings.language': '显示语言',
  'settings.languageDescription':
    '首次使用浏览器语言，并记住您手动选择的语言。',
  'settings.languageLabel': '选择显示语言',
  'settings.languageAuto': '自动（浏览器）',
  'settings.damageRange': '伤害范围',
  'settings.damageRangeDescription': '单次攻击显示的最小和最大数值',
  'settings.minDamage': '最小伤害',
  'settings.maxDamage': '最大伤害',
  'settings.critical': '暴击',
  'settings.criticalDescription': '暴击发生概率',
  'settings.criticalDecrease': '暴击率降低 10%',
  'settings.criticalRate': '暴击率',
  'settings.criticalIncrease': '暴击率提高 10%',
  'settings.hitCount': '攻击段数',
  'settings.hitCountDescription': '单次攻击显示的伤害数字数量',
  'settings.hitCountDecrease': '攻击段数减少 1',
  'settings.hitCountLabel': '攻击段数',
  'settings.hitCountUnit': '次',
  'settings.hitCountIncrease': '攻击段数增加 1',
  'settings.invincible': '怪物无敌模式',
  'settings.invincibleDescription': '防止生命值减少、击败和重生。',
  'settings.autoSave': '更改会自动保存。',
  'monster.changeCurrent': '更换怪物：当前为{name}',
  'monster.title': '更换怪物',
  'monster.description': '使用韩文名称搜索并选择要攻击的怪物。',
  'monster.close': '关闭怪物选择',
  'monster.placeholder': '例如：슬라임、주황버섯、루시드',
  'monster.searchLabel': '搜索怪物',
  'monster.searching': '正在搜索怪物…',
  'monster.currentTarget': '当前攻击目标',
  'monster.loading': '正在加载怪物…',
  'monster.error': '无法加载怪物。',
  'monster.emptyHint': '请尝试其他韩文怪物名称。',
  'background.default': '默认背景',
  'background.changeCurrent': '更换背景：当前为{name}',
  'background.title': '更换背景',
  'background.description': '使用韩文地图名称搜索并选择战斗背景。',
  'background.close': '关闭背景选择',
  'background.placeholder': '例如：헤네시스、리스항구、루디브리엄',
  'background.searchLabel': '搜索地图',
  'background.searching': '正在搜索地图…',
  'background.current': '当前背景',
  'background.defaultDescription': '返回纯色背景',
  'background.loading': '正在加载地图…',
  'background.error': '无法加载地图。',
  'background.emptyHint': '请尝试其他韩文地图名称。',
  'background.mapNumber': '地图 #{id}',
  'skin.selectCurrent': '选择伤害皮肤：当前为{name}',
  'skin.title': '选择伤害皮肤',
  'skin.description': '搜索皮肤并立即应用。',
  'skin.close': '关闭伤害皮肤选择',
  'skin.placeholder': '搜索皮肤名称',
  'skin.searchLabel': '搜索伤害皮肤',
  'skin.filterLabel': '筛选皮肤类型',
  'skin.filter.all': '全部',
  'skin.filter.unit': '单位',
  'skin.filter.action': '动作',
  'skin.current': '当前使用',
  'skin.applied': '已应用',
  'skin.list': '皮肤列表',
  'skin.loadingShort': '加载中',
  'skin.loading': '正在加载伤害皮肤…',
  'skin.emptyHint': '请尝试其他韩文名称或筛选条件。',
  'damage.accessibleLabel': '{critical}伤害 {damage}',
  'damage.criticalPrefix': '暴击',
  'map.navigation': '探索地图'
}

const translations: Record<Locale, TranslationTable> = {
  ko: korean,
  en: english,
  ja: japanese,
  'zh-CN': simplifiedChinese
}

const localeTags: Record<Locale, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  'zh-CN': 'zh-CN'
}

export const localeOptions: ReadonlyArray<{
  value: Locale
  label: string
}> = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'zh-CN', label: '简体中文' }
]

export const resolveSupportedLocale = (
  preferredLanguages: readonly string[]
): Locale => {
  for (const language of preferredLanguages) {
    const normalized = language.toLowerCase()
    if (normalized === 'ko' || normalized.startsWith('ko-')) return 'ko'
    if (normalized === 'ja' || normalized.startsWith('ja-')) return 'ja'
    if (normalized === 'zh' || normalized.startsWith('zh-')) return 'zh-CN'
    if (normalized === 'en' || normalized.startsWith('en-')) return 'en'
  }

  return 'en'
}

export const isLocalePreference = (
  value: string | null
): value is LocalePreference =>
  value === 'auto' || localeOptions.some((option) => option.value === value)

const getBrowserLocale = () =>
  resolveSupportedLocale(
    typeof navigator === 'undefined'
      ? []
      : navigator.languages.length > 0
        ? navigator.languages
        : [navigator.language]
  )

const getInitialPreference = (): LocalePreference => {
  try {
    const storedPreference = localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocalePreference(storedPreference) ? storedPreference : 'auto'
  } catch {
    return 'auto'
  }
}

type I18nContextValue = {
  locale: Locale
  localePreference: LocalePreference
  setLocalePreference: (preference: LocalePreference) => void
  t: (key: TranslationKey, params?: TranslationParams) => string
  formatNumber: (value: number) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export const I18nProvider: React.FC<React.PropsWithChildren> = ({
  children
}) => {
  const [localePreference, setLocalePreferenceState] =
    useState<LocalePreference>(getInitialPreference)
  const [browserLocale, setBrowserLocale] = useState<Locale>(getBrowserLocale)
  const locale = localePreference === 'auto' ? browserLocale : localePreference

  useEffect(() => {
    const handleLanguageChange = () => setBrowserLocale(getBrowserLocale())
    window.addEventListener('languagechange', handleLanguageChange)
    return () =>
      window.removeEventListener('languagechange', handleLanguageChange)
  }, [])

  const setLocalePreference = useCallback((preference: LocalePreference) => {
    setLocalePreferenceState(preference)

    try {
      if (preference === 'auto') {
        localStorage.removeItem(LOCALE_STORAGE_KEY)
      } else {
        localStorage.setItem(LOCALE_STORAGE_KEY, preference)
      }
    } catch {
      // The language still changes for this session when storage is unavailable.
    }
  }, [])

  const t = useCallback(
    (key: TranslationKey, params: TranslationParams = {}) =>
      Object.entries(params).reduce(
        (message, [name, value]) =>
          message.replaceAll(`{${name}}`, String(value)),
        translations[locale][key]
      ),
    [locale]
  )

  const formatNumber = useCallback(
    (value: number) => new Intl.NumberFormat(localeTags[locale]).format(value),
    [locale]
  )

  useEffect(() => {
    document.documentElement.lang = localeTags[locale]
    document.title = t('app.title')

    let description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    )
    if (!description) {
      description = document.createElement('meta')
      description.name = 'description'
      document.head.appendChild(description)
    }
    description.content = t('app.description')
  }, [locale, t])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      localePreference,
      setLocalePreference,
      t,
      formatNumber
    }),
    [formatNumber, locale, localePreference, setLocalePreference, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within I18nProvider')
  return context
}
