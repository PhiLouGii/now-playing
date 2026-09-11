import type {
  Question,
} from '../types/game'

export type DailyTheme = {
  name: string
  description: string
}

export type DailyTwistType =
  | 'lightning'
  | 'streak-rush'
  | 'deep-cut'
  | 'mixed-bag'
  | 'perfect-ten'

export type DailyTwist = {
  type: DailyTwistType
  name: string
  description: string
}

export type DailyChallenge = {
  id: string
  date: string
  theme: DailyTheme
  twist: DailyTwist
  questions: Question[]
  questionCount: number
}

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