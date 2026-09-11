import type {
  DailyChallenge,
} from '../types/dailyChallenge.ts'

const API_URL =
  'http://localhost:3000/api'

export async function getDailyChallenge(): Promise<DailyChallenge> {
  const response = await fetch(
    `${API_URL}/daily-challenge`,
  )

  if (!response.ok) {
    throw new Error(
      'Failed to load daily challenge',
    )
  }

  const data =
    (await response.json()) as {
      challenge: DailyChallenge
    }

  return data.challenge
}