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

const MAX_ATTEMPTS_PER_QUESTION = 5

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

async function generateDailyQuestion(
  index: number,
): Promise<DailyQuestion> {
  const questionType =
    getQuestionType(index)

  const difficulty =
    getDifficulty(index)

  let lastError: unknown

  for (
    let attempt = 0;
    attempt < MAX_ATTEMPTS_PER_QUESTION;
    attempt += 1
  ) {
    try {
      return await generateGameQuestion(
        questionType,
        difficulty,
      )
    } catch (error) {
      lastError = error

      console.warn(
        `Daily question ${index + 1} attempt ${
          attempt + 1
        } failed:`,
        error,
      )
    }
  }

  throw new Error(
    `Could not generate daily question ${
      index + 1
    } after ${MAX_ATTEMPTS_PER_QUESTION} attempts. Last error: ${
      lastError instanceof Error
        ? lastError.message
        : String(lastError)
    }`,
  )
}

export async function getDailyChallenge(
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
    const question =
      await generateDailyQuestion(index)

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