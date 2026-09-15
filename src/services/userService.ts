import { getIdToken } from 'firebase/auth'

import { auth } from '../config/firebase'

export interface PersonalBests {
  nameThatSong: number | null
  nameTheArtist: number | null
  nameTheAlbum: number | null
  guessTheYear: number | null
  dailyChallenge: number | null
}

export interface UserStats {
  gamesPlayed: number
  totalPoints: number
  totalCorrectAnswers: number
  averageAccuracy: number
  bestStreak: number
  personalBests: PersonalBests
}

export async function getUserStats(): Promise<UserStats> {
  const currentUser =
    auth.currentUser

  if (!currentUser) {
    throw new Error(
      'You must be logged in to view your stats.',
    )
  }

  const idToken =
    await getIdToken(currentUser)

  const response = await fetch(
    'http://localhost:3000/api/users/stats',
    {
      headers: {
        Authorization:
          `Bearer ${idToken}`,
      },
    },
  )

  const data =
    await response.json()

  if (!response.ok) {
    throw new Error(
      data.error ||
        'Failed to load user stats.',
    )
  }

  console.log(
    'USER STATS LOADED:',
    data,
  )

  return data
}