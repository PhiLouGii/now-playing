import {
  calculateFinalPoints,
} from './gameScoring'

import type {
  DailyTwistType,
} from '../dailyChallengeService'

type DailyScoringResult = {
  basePoints: number
  streakMultiplier: number
  twistBonus: number
  finalPoints: number
}

export function calculateDailyPoints(
  listenDuration: number,
  streak: number,
  twist: DailyTwistType,
): DailyScoringResult {
  const baseWithStreak =
    calculateFinalPoints(
      listenDuration,
      streak,
    )

  let twistBonus = 0

  if (twist === 'lightning') {
    if (listenDuration <= 0.1) {
      twistBonus = 250
    } else if (listenDuration <= 0.5) {
      twistBonus = 150
    } else if (listenDuration <= 2) {
      twistBonus = 75
    }
  }

  if (twist === 'streak-rush') {
    if (streak >= 5) {
      twistBonus = 250
    } else if (streak >= 3) {
      twistBonus = 100
    }
  }

  return {
    basePoints: baseWithStreak,
    streakMultiplier:
      baseWithStreak /
      Math.max(
        1,
        Math.round(
          baseWithStreak /
            Math.max(
              1,
              calculateFinalPoints(
                listenDuration,
                1,
              ),
            ),
        ),
      ),
    twistBonus,
    finalPoints:
      baseWithStreak + twistBonus,
  }
}