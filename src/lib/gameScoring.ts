const STAGE_POINTS = {
  0.1: 1000,
  0.5: 800,
  2: 600,
  8: 400,
  15: 200,
} as const

export function calculatePoints(
  maxListenDuration: number,
): number {
  if (maxListenDuration <= 0.1) {
    return STAGE_POINTS[0.1]
  }

  if (maxListenDuration <= 0.5) {
    return STAGE_POINTS[0.5]
  }

  if (maxListenDuration <= 2) {
    return STAGE_POINTS[2]
  }

  if (maxListenDuration <= 8) {
    return STAGE_POINTS[8]
  }

  return STAGE_POINTS[15]
}

export function calculateStreakMultiplier(
  streak: number,
): number {
  if (streak >= 5) {
    return 2
  }

  if (streak >= 4) {
    return 1.5
  }

  if (streak >= 3) {
    return 1.25
  }

  if (streak >= 2) {
    return 1.1
  }

  return 1
}

export function calculateFinalPoints(
  maxListenDuration: number,
  streak: number,
): number {
  const basePoints =
    calculatePoints(maxListenDuration)

  const multiplier =
    calculateStreakMultiplier(streak)

  return Math.round(
    basePoints * multiplier,
  )
}
