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

export async function getLeaderboard(): Promise<
  LeaderboardEntry[]
> {
  const response = await fetch(
    'http://localhost:3000/api/leaderboard',
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
    data,
  )

  return data
}