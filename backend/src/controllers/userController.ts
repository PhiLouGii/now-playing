import type { Response } from 'express'
import { getFirestore } from 'firebase-admin/firestore'

import type {
  AuthenticatedRequest,
} from '../middleware/authMiddleware'

const db = getFirestore()

export async function getUserStats(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      })
    }

    const userId = req.user.uid

    /*
     * Get every score belonging to the
     * currently authenticated user.
     */
    const scoresSnapshot =
      await db
        .collection('scores')
        .where(
          'userId',
          '==',
          userId,
        )
        .get()

    const scores =
      scoresSnapshot.docs.map(
        (scoreDoc) =>
          scoreDoc.data(),
      )

    /*
     * No games played yet.
     */
    if (scores.length === 0) {
      return res.json({
        gamesPlayed: 0,
        totalPoints: 0,
        totalCorrectAnswers: 0,
        averageAccuracy: 0,
        bestStreak: 0,
        personalBests: {
          nameThatSong: null,
          nameTheArtist: null,
          nameTheAlbum: null,
          guessTheYear: null,
          dailyChallenge: null,
        },
      })
    }

    /*
     * Total games.
     */
    const gamesPlayed =
      scores.length

    /*
     * Total points earned.
     */
    const totalPoints =
      scores.reduce(
        (total, score) =>
          total + score.score,
        0,
      )

    /*
     * Total correct answers.
     */
    const totalCorrectAnswers =
      scores.reduce(
        (total, score) =>
          total +
          score.correctAnswers,
        0,
      )

    /*
     * Average accuracy.
     */
    const totalAccuracy =
      scores.reduce(
        (total, score) =>
          total + score.accuracy,
        0,
      )

    const averageAccuracy =
      Math.round(
        totalAccuracy /
          gamesPlayed,
      )

    /*
     * Best streak ever.
     */
    const bestStreak =
      Math.max(
        ...scores.map(
          (score) =>
            score.bestStreak,
        ),
      )

    /*
     * Best score for each game mode.
     */
    const personalBests = {
      nameThatSong: null as number | null,
      nameTheArtist: null as number | null,
      nameTheAlbum: null as number | null,
      guessTheYear: null as number | null,
      dailyChallenge: null as number | null,
    }

    scores.forEach(
      (score) => {
        switch (score.gameMode) {
          case 'name-that-song':
            if (
              personalBests.nameThatSong ===
                null ||
              score.score >
                personalBests.nameThatSong
            ) {
              personalBests.nameThatSong =
                score.score
            }
            break

          case 'name-the-artist':
            if (
              personalBests.nameTheArtist ===
                null ||
              score.score >
                personalBests.nameTheArtist
            ) {
              personalBests.nameTheArtist =
                score.score
            }
            break

          case 'name-the-album':
            if (
              personalBests.nameTheAlbum ===
                null ||
              score.score >
                personalBests.nameTheAlbum
            ) {
              personalBests.nameTheAlbum =
                score.score
            }
            break

          case 'guess-the-year':
            if (
              personalBests.guessTheYear ===
                null ||
              score.score >
                personalBests.guessTheYear
            ) {
              personalBests.guessTheYear =
                score.score
            }
            break

          case 'daily-challenge':
            if (
              personalBests.dailyChallenge ===
                null ||
              score.score >
                personalBests.dailyChallenge
            ) {
              personalBests.dailyChallenge =
                score.score
            }
            break
        }
      },
    )

    const stats = {
      gamesPlayed,
      totalPoints,
      totalCorrectAnswers,
      averageAccuracy,
      bestStreak,
      personalBests,
    }

    console.log(
      'USER STATS FETCHED:',
      userId,
      stats,
    )

    return res.json(stats)
  } catch (error) {
    console.error(
      'USER STATS ERROR:',
      error,
    )

    return res.status(500).json({
      error: 'Failed to load user stats',
    })
  }
}

export async function getUserScores(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      })
    }

    const userId = req.user.uid

    /*
     * Get the user's most recent scores.
     */
    const scoresSnapshot =
      await db
        .collection('scores')
        .where(
          'userId',
          '==',
          userId,
        )
        .get()

    const scores =
      scoresSnapshot.docs
        .map((scoreDoc) => ({
          id: scoreDoc.id,
          ...scoreDoc.data(),
        }))
        .sort(
          (scoreA, scoreB) => {
            const dateA =
              scoreA.completedAt?.toMillis?.() ??
              0

            const dateB =
              scoreB.completedAt?.toMillis?.() ??
              0

            return dateB - dateA
          },
        )
        .slice(0, 20)

    console.log(
      'USER SCORE HISTORY FETCHED:',
      userId,
      scores.length,
      'scores',
    )

    return res.json(scores)
  } catch (error) {
    console.error(
      'USER SCORE HISTORY ERROR:',
      error,
    )

    return res.status(500).json({
      error:
        'Failed to load score history',
    })
  }
}