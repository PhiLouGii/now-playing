import type { Question } from '../game/gameTypes.js'

export type DailyTwistType =
  | 'lightning'
  | 'streak-rush'
  | 'deep-cut'
  | 'mixed-bag'
  | 'perfect-ten'

export type DailyTheme = {
  name: string
  description: string
}

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