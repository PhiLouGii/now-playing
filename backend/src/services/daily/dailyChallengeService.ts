import {
  generateGameQuestion,
} from '../game/gameQuestionService.js'

import type {
  QuestionType,
  QuestionDifficulty,
} from '../game/gameTypes.js'

import {
  getDailyTheme,
  getDailyTwist,
} from './dailyChallengeUtils.js'

import type {
  DailyChallenge,
  DailyQuestion,
} from './dailyChallengeTypes.js'

const DAILY_QUESTION_COUNT = 10

const QUESTION_TYPES: QuestionType[] = [
  'name-the-song',
  'name-the-artist',
  'name-the-album',
  'guess-the-year',
]

const DIFFICULTIES: QuestionDifficulty[] = [
  'easy',
  'medium',
  'hard',
]

function getTodayDate(): string {
  return new Date()
    .toISOString()
    .split('T')[0]
}

function createDailyId(
  date: string,
): string {
  return `daily-${date}`
}

function getQuestionType(
  index: number,
): QuestionType {
  return QUESTION_TYPES[
    index % QUESTION_TYPES.length
  ]
}

function getDifficulty(
  index: number,
): QuestionDifficulty {
  return DIFFICULTIES[
    index % DIFFICULTIES.length
  ]
}

export async function generateDailyChallenge(
  date: string = getTodayDate(),
): Promise<DailyChallenge> {
  const theme = getDailyTheme(date)
  const twist = getDailyTwist(date)

  const questions: DailyQuestion[] = []

  for (
    let index = 0;
    index < DAILY_QUESTION_COUNT;
    index += 1
  ) {
    const questionType =
      getQuestionType(index)

    const difficulty =
      getDifficulty(index)

    const question =
      await generateGameQuestion(
        questionType,
        difficulty,
      )

    questions.push(question)
  }

  return {
    id: createDailyId(date),
    date,
    theme,
    twist,
    questions,
    questionCount: questions.length,
  }
}