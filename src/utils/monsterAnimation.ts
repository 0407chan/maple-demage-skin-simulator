const IDLE_ANIMATION_CANDIDATES = [
  'stand',
  'stand0',
  'move',
  'walk',
  'fly',
  'jump'
] as const

const HIT_ANIMATION_CANDIDATES = ['hit1', 'hit2', 'hit', 'damaged'] as const

const isAvailable = (
  framebooks: Record<string, number> | undefined,
  animation: string
) => (framebooks?.[animation] ?? 0) > 0

export const getPrimaryMonsterAnimation = (
  framebooks: Record<string, number> | undefined,
  type: 'idle' | 'hit'
) => {
  const candidates =
    type === 'idle' ? IDLE_ANIMATION_CANDIDATES : HIT_ANIMATION_CANDIDATES

  return candidates.find((animation) => isAvailable(framebooks, animation))
}

export const getMonsterAnimationsToPreload = (
  framebooks: Record<string, number> | undefined
) =>
  [...IDLE_ANIMATION_CANDIDATES, ...HIT_ANIMATION_CANDIDATES].filter(
    (animation) => isAvailable(framebooks, animation)
  )
