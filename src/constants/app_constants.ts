export const REGION = 'KMST'
export const DEFAULT_SKIN_NUMBER = 287
export const ATTACK_ANIMATION_DURATION = 1000 // ms
export const DEATH_ANIMATION_DURATION = 1200 // ms
export const RESPAWN_ANIMATION_DURATION = 800 // ms

export const DEFAULT_MONSTER = {
  id: 1210102,
  name: '주황버섯',
  mobType: '1N',
  level: 10,
  isBoss: false
}

export const DEFAULT_SETTINGS = {
  NUMBER_ATTACK: 5,
  MAX_DAMAGE: 1000000,
  MIN_DAMAGE: 100000,
  CRITICAL_RATE: 60
}

export const SETTING_LIMITS = {
  MIN_DAMAGE: 1,
  MAX_DAMAGE: 150000000000,
  MIN_CRITICAL_RATE: 0,
  MAX_CRITICAL_RATE: 100,
  MIN_NUMBER_ATTACK: 1,
  MAX_NUMBER_ATTACK: 10
}

export const API_ENDPOINTS = {
  WZ_VERSION: '/api/wz-version'
}
