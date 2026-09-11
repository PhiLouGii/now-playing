import type {
  generateGameQuestion,
} from '../game/gameQuestionService.js'

export type DailyQuestion =
  Awaited<
    ReturnType<typeof generateGameQuestion>
  >

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
  questions: DailyQuestion[]
  questionCount: number
}