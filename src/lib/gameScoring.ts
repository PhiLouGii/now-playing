export function calculatePoints(timeRemaining: number) {
  if (timeRemaining >= 8) {
    return 1000
  }

  if (timeRemaining >= 6) {
    return 800
  }

  if (timeRemaining >= 4) {
    return 600
  }

  if (timeRemaining >= 2) {
    return 400
  }

  if (timeRemaining >= 1) {
    return 200
  }

  return 0
}

export function calculateStreakMultiplier(streak: number) {
  if (streak >= 5) {
    return 2
  }

  if (streak === 4) {
    return 1.5
  }

  if (streak === 3) {
    return 1.25
  }

  if (streak === 2) {
    return 1.1
  }

  return 1
}

export function calculateFinalPoints(
  timeRemaining: number,
  streak: number,
) {
  const basePoints = calculatePoints(timeRemaining)
  const multiplier = calculateStreakMultiplier(streak)

  return Math.round(basePoints * multiplier)
}