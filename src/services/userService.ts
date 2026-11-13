import { getIdToken } from 'firebase/auth'

import { auth } from '../config/firebase'

export interface PersonalBests {
  nameThatSong: number | null
  nameTheArtist: number | null
  nameTheAlbum: number | null
  guessTheYear: number | null
  pixelCover: number | null
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

export interface UserScore {
  id: string
  userId: string
  gameMode:
  | 'name-that-song'
  | 'name-the-artist'
  | 'name-the-album'
  | 'guess-the-year'
  | 'pixel-cover'
  | 'daily-challenge'
  score: number
  accuracy: number
  bestStreak: number
  questions: number
  correctAnswers: number
  totalListeningTime: number
  completedAt: {
    _seconds: number
    _nanoseconds: number
  }
}

async function getAuthHeaders() {
  const currentUser =
    auth.currentUser

  if (!currentUser) {
    throw new Error(
      'You must be logged in.',
    )
  }

  const idToken =
    await getIdToken(currentUser)

  return {
    Authorization:
      `Bearer ${idToken}`,
  }
}

export async function getUserStats(): Promise<UserStats> {
  const headers =
    await getAuthHeaders()

  const response = await fetch(
    'http://localhost:3000/api/users/stats',
    {
      headers,
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

export async function getUserScores(): Promise<
  UserScore[]
> {
  const headers =
    await getAuthHeaders()

  const response = await fetch(
    'http://localhost:3000/api/users/scores',
    {
      headers,
    },
  )

  const data =
    await response.json()

  if (!response.ok) {
    throw new Error(
      data.error ||
        'Failed to load score history.',
    )
  }

  console.log(
    'USER SCORE HISTORY LOADED:',
    data,
  )

  return data
}