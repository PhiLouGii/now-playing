import type {
  Request,
  Response,
} from 'express'

import {
  getDailyChallenge,
} from '../services/daily/dailyChallengeService.js'

export async function getTodayDailyChallenge(
  _req: Request,
  res: Response,
) {
  try {
    const challenge =
      await getDailyChallenge()

    return res.json({
      challenge,
    })
  } catch (error) {
    console.error(
      'Failed to get daily challenge:',
      error,
    )

    return res.status(500).json({
      error:
        'Failed to get daily challenge',
    })
  }
}