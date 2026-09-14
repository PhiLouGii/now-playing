import type { Response } from 'express'
import { getFirestore } from 'firebase-admin/firestore'

import type { AuthenticatedRequest } from '../middleware/authMiddleware'

const db = getFirestore()

export async function submitScore(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      })
    }

    const {
      gameMode,
      score,
      accuracy,
      bestStreak,
      questions,
      correctAnswers,
      totalListeningTime,
    } = req.body

    if (
      !gameMode ||
      typeof score !== 'number' ||
      typeof accuracy !== 'number' ||
      typeof bestStreak !== 'number' ||
      typeof questions !== 'number' ||
      typeof correctAnswers !== 'number' ||
      typeof totalListeningTime !== 'number'
    ) {
      return res.status(400).json({
        error: 'Invalid score data',
      })
    }

    const scoreData = {
      userId: req.user.uid,
      gameMode,
      score,
      accuracy,
      bestStreak,
      questions,
      correctAnswers,
      totalListeningTime,
      completedAt: new Date(),
    }

    const scoreRef =
      await db.collection('scores').add(scoreData)

    console.log(
      'SCORE SAVED:',
      scoreRef.id,
      scoreData,
    )

    return res.status(201).json({
      message: 'Score saved successfully',
      scoreId: scoreRef.id,
    })
  } catch (error) {
    console.error(
      'SCORE SUBMISSION ERROR:',
      error,
    )

    return res.status(500).json({
      error: 'Failed to save score',
    })
  }
}