export type LeaderboardGameMode =
  | 'name-that-song'
  | 'name-the-artist'
  | 'name-the-album'
  | 'guess-the-year'
  | 'daily-challenge'

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

export async function getLeaderboard(
  gameMode?: LeaderboardGameMode,
): Promise<LeaderboardEntry[]> {
  const url = new URL(
    'http://localhost:3000/api/leaderboard',
  )

  if (gameMode) {
    url.searchParams.set(
      'gameMode',
      gameMode,
    )
  }

  const response = await fetch(
    url.toString(),
  )

  const data = await response.json()

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