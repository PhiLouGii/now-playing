type DailyTwistType =
  | 'lightning'
  | 'streak-rush'
  | 'deep-cut'
  | 'mixed-bag'
  | 'perfect-ten'

type DailyPointsResult = {
  basePoints: number
  streakMultiplier: number
  twistMultiplier: number
  finalPoints: number
}

export function calculateDailyPoints(
  listenDuration: number,
  streak: number,
  twist: DailyTwistType,
): DailyPointsResult {
  const basePoints = Math.max(
    100,
    Math.round(
      1000 -
      listenDuration * 50,
    ),
  )

  const streakMultiplier =
    Math.min(
      1 + (streak - 1) * 0.25,
      3,
    )

  const twistMultiplier =
    twist === 'lightning'
      ? 1.5
      : twist === 'streak-rush'
        ? 1.25
        : twist === 'perfect-ten'
          ? 1.2
          : 1

  const finalPoints =
    Math.round(
      basePoints *
      streakMultiplier *
      twistMultiplier,
    )

  return {
    basePoints,
    streakMultiplier,
    twistMultiplier,
    finalPoints,
  }
}