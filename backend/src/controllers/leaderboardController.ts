import type { Request, Response } from 'express'
import { getFirestore } from 'firebase-admin/firestore'

const db = getFirestore()

export async function getLeaderboard(
  _req: Request,
  res: Response,
) {
  try {
    const scoresSnapshot =
      await db
        .collection('scores')
        .orderBy('score', 'desc')
        .limit(50)
        .get()

    const leaderboard = await Promise.all(
      scoresSnapshot.docs.map(
        async (scoreDoc, index) => {
          const scoreData =
            scoreDoc.data()

          const userId =
            scoreData.userId

          let username = 'Player'
          let displayName = 'Player'

          if (userId) {
            const userSnapshot =
              await db
                .collection('users')
                .doc(userId)
                .get()

            if (userSnapshot.exists) {
              const userData =
                userSnapshot.data()

              username =
                userData?.username ||
                'Player'

              displayName =
                userData?.displayName ||
                username
            }
          }

          return {
            rank: index + 1,
            username,
            displayName,
            score: scoreData.score,
            accuracy: scoreData.accuracy,
            bestStreak:
              scoreData.bestStreak,
            questions:
              scoreData.questions,
            correctAnswers:
              scoreData.correctAnswers,
            totalListeningTime:
              scoreData.totalListeningTime,
            gameMode:
              scoreData.gameMode,
            completedAt:
              scoreData.completedAt,
          }
        },
      ),
    )

    console.log(
      'LEADERBOARD FETCHED:',
      leaderboard.length,
      'scores',
    )

    return res.json(leaderboard)
  } catch (error) {
    console.error(
      'LEADERBOARD ERROR:',
      error,
    )

    return res.status(500).json({
      error: 'Failed to load leaderboard',
    })
  }
}