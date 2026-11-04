import { getIdToken } from 'firebase/auth'

import { auth } from '../config/firebase'

export type LeaderboardGameMode =
  | 'name-that-song'
  | 'name-the-artist'
  | 'name-the-album'
  | 'guess-the-year'
  | 'pixel-cover'

export interface LeaderboardEntry {
  rank: number
  username: string
  displayName: string
  score: number
  accuracy: number
  bestStreak: number
  questions: number
  correctAnswers: number
  totalListeningTime: number
  gameMode: string
  completedAt: {
    _seconds: number
    _nanoseconds: number
  }
}

export interface CurrentUserLeaderboard {
  rank: number | null
  score: number | null
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  currentUser: CurrentUserLeaderboard | null
}

export async function getLeaderboard(
  gameMode?: LeaderboardGameMode,
): Promise<LeaderboardResponse> {
  const url = new URL(
    'http://localhost:3000/api/leaderboard',
  )

  if (gameMode) {
    url.searchParams.set(
      'gameMode',
      gameMode,
    )
  }

  const currentUser =
    auth.currentUser

  const headers: HeadersInit = {}

  /*
   * Send the Firebase token when logged in.
   *
   * The backend treats this as optional.
   */
  if (currentUser) {
    const idToken =
      await getIdToken(currentUser)

    headers.Authorization =
      `Bearer ${idToken}`
  }

  const response = await fetch(
    url.toString(),
    {
      headers,
    },
  )

  const data =
    await response.json()

  if (!response.ok) {
    throw new Error(
      data.error ||
        'Failed to load leaderboard.',
    )
  }

  console.log(
    'LEADERBOARD LOADED:',
    gameMode
      ? `mode=${gameMode}`
      : 'all modes',
    data,
  )

  return data
}