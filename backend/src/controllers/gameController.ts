import type { Request, Response } from 'express'
import {
  generateGameQuestion,
} from '../services/game/gameQuestionService.js'
import type {
  QuestionDifficulty,
  QuestionType,
} from '../services/game/gameTypes.js'

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

export async function getGameQuestion(
  req: Request,
  res: Response,
) {
  try {
    const type =
      typeof req.query.type === 'string'
        ? req.query.type as QuestionType
        : 'name-the-song'

    const difficulty =
      typeof req.query.difficulty === 'string'
        ? req.query.difficulty as QuestionDifficulty
        : 'medium'

    const decade =
      typeof req.query.decade === 'string'
        ? Number(req.query.decade)
        : undefined

    const excludedTrackIds =
      typeof req.query.exclude === 'string'
        ? req.query.exclude
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        : []

    if (!QUESTION_TYPES.includes(type)) {
      return res.status(400).json({
        error: 'Invalid question type',
      })
    }

    if (!DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({
        error: 'Invalid difficulty',
      })
    }

    if (
      decade !== undefined &&
      (!Number.isInteger(decade) ||
        decade < 1900 ||
        decade > 2100)
    ) {
      return res.status(400).json({
        error: 'Invalid decade',
      })
    }

    const question =
      await generateGameQuestion(
        type,
        difficulty,
        decade,
        excludedTrackIds,
      )

    return res.json({
      question,
    })
  } catch (error) {
    console.error(
      'Failed to generate game question:',
      error,
    )

    return res.status(500).json({
      error:
        'Failed to generate game question',
    })
  }
}
