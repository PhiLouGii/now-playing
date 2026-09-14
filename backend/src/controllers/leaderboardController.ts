import type { Request, Response } from 'express'
import { getFirestore } from 'firebase-admin/firestore'

const db = getFirestore()

export async function getLeaderboard(
  req: Request,
  res: Response,
) {
  try {
    const gameMode =
      typeof req.query.gameMode === 'string'
        ? req.query.gameMode
        : null

    let scoresQuery =
      db.collection('scores')

    if (gameMode) {
      scoresQuery =
        scoresQuery.where(
          'gameMode',
          '==',
          gameMode,
        )
    }

    const scoresSnapshot =
      await scoresQuery.get()

    /*
     * Keep only the best score for each player.
     */
    const bestScoresByUser =
      new Map<string, FirebaseFirestore.DocumentData>()

    scoresSnapshot.docs.forEach(
      (scoreDoc) => {
        const scoreData =
          scoreDoc.data()

        const userId =
          scoreData.userId

        if (!userId) {
          return
        }

        const existingScore =
          bestScoresByUser.get(userId)

        if (
          !existingScore ||
          scoreData.score >
            existingScore.score
        ) {
          bestScoresByUser.set(
            userId,
            scoreData,
          )
        }
      },
    )

    /*
     * Convert the map into an array and
     * sort players by their best score.
     */
    const sortedScores = Array.from(
      bestScoresByUser.entries(),
    )
      .sort(
        ([, scoreA], [, scoreB]) =>
          scoreB.score - scoreA.score,
      )
      .slice(0, 50)

    /*
     * Build the final leaderboard.
     */
    const leaderboard =
      await Promise.all(
        sortedScores.map(
          async (
            [userId, scoreData],
            index,
          ) => {
            let username = 'Player'
            let displayName = 'Player'

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

            return {
              rank: index + 1,
              username,
              displayName,
              score: scoreData.score,
              accuracy:
                scoreData.accuracy,
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
      gameMode
        ? `mode=${gameMode}`
        : 'all modes',
      leaderboard.length,
      'players',
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