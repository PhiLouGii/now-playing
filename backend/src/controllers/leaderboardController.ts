import type { Request, Response } from 'express'
import type { Query } from 'firebase-admin/firestore'

import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const db = getFirestore()

export async function getLeaderboard(
  req: Request,
  res: Response,
) {
  try {
    /*
     * The leaderboard is public.
     *
     * If the user is logged in, we optionally identify
     * them so we can return their personal rank.
     */
    let currentUserId: string | null = null

    const authHeader =
      req.headers.authorization

    if (authHeader?.startsWith('Bearer ')) {
      const idToken =
        authHeader.substring('Bearer '.length)

      try {
        const decodedToken =
          await getAuth().verifyIdToken(idToken)

        currentUserId = decodedToken.uid
      } catch (error) {
        console.warn(
          'OPTIONAL LEADERBOARD AUTH FAILED:',
          error,
        )
      }
    }

    const gameMode =
      typeof req.query.gameMode === 'string'
        ? req.query.gameMode
        : null

    let scoresQuery: Query =
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
      new Map<
        string,
        FirebaseFirestore.DocumentData
      >()

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
     * Sort every player by their best score.
     */
    const sortedScores =
      Array.from(
        bestScoresByUser.entries(),
      ).sort(
        ([, scoreA], [, scoreB]) =>
          scoreB.score - scoreA.score,
      )

    /*
     * Assign competition-style ranks.
     *
     * Example:
     *
     * 1000 → #1
     * 1000 → #1
     * 900  → #3
     */
    let currentRank = 0
    let previousScore: number | null = null

    const rankedScores =
      sortedScores.map(
        (
          [userId, scoreData],
          index,
        ) => {
          if (
            previousScore === null ||
            scoreData.score !== previousScore
          ) {
            currentRank = index + 1
          }

          previousScore =
            scoreData.score

          return {
            userId,
            scoreData,
            rank: currentRank,
          }
        },
      )

    /*
     * Only the top 50 are displayed publicly.
     *
     * The full ranked list is kept above so that
     * we can still calculate a user's rank even
     * if they are outside the top 50.
     */
    const topScores =
      rankedScores.slice(0, 50)

    /*
     * Find the current user's personal ranking.
     */
    const currentUserEntry =
      currentUserId
        ? rankedScores.find(
            (entry) =>
              entry.userId ===
              currentUserId,
          )
        : undefined

    const currentUser =
      currentUserId
        ? {
            rank:
              currentUserEntry?.rank ??
              null,
            score:
              currentUserEntry?.scoreData
                ?.score ?? null,
          }
        : null

    /*
     * Build the public leaderboard.
     */
    const leaderboard =
      await Promise.all(
        topScores.map(
          async ({
            userId,
            scoreData,
            rank,
          }) => {
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
              rank,
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

    if (currentUserId) {
      console.log(
        'CURRENT USER RANK:',
        currentUser,
      )
    }

    return res.json({
      leaderboard,
      currentUser,
    })
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