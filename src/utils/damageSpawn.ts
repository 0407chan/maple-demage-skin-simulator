const DAMAGE_SPAWN_GAP = 12
const MINIMUM_SPAWN_BOTTOM = 80
const VIEWPORT_TOP_INSET = 24

type DamageSpawnPosition = {
  viewportHeight: number
  monsterTop: number
}

type DamageAnchorPosition = {
  monsterAnchorBottom: number
  currentMonsterTop: number
  idleMonsterTopOffset?: number
}

export const getDamageAnchorTop = ({
  monsterAnchorBottom,
  currentMonsterTop,
  idleMonsterTopOffset
}: DamageAnchorPosition) =>
  idleMonsterTopOffset === undefined
    ? currentMonsterTop
    : monsterAnchorBottom - idleMonsterTopOffset

export const getDamageSpawnBottom = ({
  viewportHeight,
  monsterTop
}: DamageSpawnPosition) =>
  Math.min(
    viewportHeight - VIEWPORT_TOP_INSET,
    Math.max(
      MINIMUM_SPAWN_BOTTOM,
      viewportHeight - monsterTop + DAMAGE_SPAWN_GAP
    )
  )
