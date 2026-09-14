import { getIdToken } from 'firebase/auth'

import { auth } from '../config/firebase'

export type GameMode =
  | 'name-that-song'
  | 'name-the-artist'
  | 'name-the-album'
  | 'guess-the-year'
  | 'daily-challenge'

export interface SubmitScoreData {
  gameMode: GameMode
  score: number
  accuracy: number
  bestStreak: number
  questions: number
  correctAnswers: number
  totalListeningTime: number
}

export async function submitScore(
  scoreData: SubmitScoreData,
) {
  const currentUser = auth.currentUser

  if (!currentUser) {
    throw new Error(
      'You must be logged in to submit a score.',
    )
  }

  const idToken =
    await getIdToken(currentUser)

  const response = await fetch(
    'http://localhost:3000/api/scores',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(scoreData),
    },
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.error ||
        'Failed to submit score.',
    )
  }

  console.log(
    'SCORE SUBMITTED:',
    data,
  )

  return data
}