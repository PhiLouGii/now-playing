import type {
  Request,
  Response,
} from 'express'

import {
  generateGameQuestion,
} from '../services/game/gameQuestionService.js'

import type {
  QuestionDifficulty,
  QuestionType,
} from '../services/game/gameTypes.js'

const VALID_QUESTION_TYPES:
  QuestionType[] = [
    'name-the-song',
    'name-the-artist',
    'name-the-album',
    'guess-the-year',
  ]

const VALID_DIFFICULTIES:
  QuestionDifficulty[] = [
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
        ? req.query.type
        : 'name-the-song'

    const difficulty =
      typeof req.query.difficulty ===
      'string'
        ? req.query.difficulty
        : 'medium'

    const decade =
      typeof req.query.decade === 'string'
        ? Number(req.query.decade)
        : undefined

    const categoryId =
      typeof req.query.category ===
      'string'
        ? req.query.category.trim()
        : undefined

    const artist =
      typeof req.query.artist ===
      'string'
        ? req.query.artist.trim()
        : undefined

    const artistId =
      typeof req.query.artistId ===
      'string'
        ? req.query.artistId.trim()
        : undefined

    const excludeParam =
      typeof req.query.exclude ===
      'string'
        ? req.query.exclude
        : ''

    const excludedTrackIds =
      excludeParam
        ? excludeParam
            .split(',')
            .map(id => id.trim())
            .filter(Boolean)
        : []

    if (
      !VALID_QUESTION_TYPES.includes(
        type as QuestionType,
      )
    ) {
      return res.status(400).json({
        error:
          `Invalid question type: ${type}`,
      })
    }

    if (
      !VALID_DIFFICULTIES.includes(
        difficulty as QuestionDifficulty,
      )
    ) {
      return res.status(400).json({
        error:
          `Invalid difficulty: ${difficulty}`,
      })
    }

    if (
      decade !== undefined &&
      (
        Number.isNaN(decade) ||
        decade < 1900 ||
        decade > 2100 ||
        decade % 10 !== 0
      )
    ) {
      return res.status(400).json({
        error:
          'Invalid decade.',
      })
    }

    if (
      categoryId === ''
    ) {
      return res.status(400).json({
        error:
          'Category cannot be empty.',
      })
    }

    if (
      artist === ''
    ) {
      return res.status(400).json({
        error:
          'Artist cannot be empty.',
      })
    }

    if (
      artistId === ''
    ) {
      return res.status(400).json({
        error:
          'Artist ID cannot be empty.',
      })
    }

    /*
     * Category and artist are different
     * source filters. They cannot be used
     * together.
     */
    if (
      categoryId &&
      (artist || artistId)
    ) {
      return res.status(400).json({
        error:
          'Category and artist cannot be used together.',
      })
    }

    /*
     * Artist-filtered gameplay is always
     * a name-the-song game.
     */
    if (
      (artist || artistId) &&
      type !== 'name-the-song'
    ) {
      return res.status(400).json({
        error:
          'Play by Artist uses the name-the-song question type.',
      })
    }

    /*
     * An artist ID is required for the
     * Play by Artist flow.
     *
     * The ID comes from the Deezer artist
     * selected on the Play page.
     */
    if (
      artist &&
      !artistId
    ) {
      return res.status(400).json({
        error:
          'Artist ID is required for Play by Artist.',
      })
    }

    /*
     * Do not allow an artist ID without
     * its corresponding artist name.
     */
    if (
      artistId &&
      !artist
    ) {
      return res.status(400).json({
        error:
          'Artist name is required when using an artist ID.',
      })
    }

    /*
     * Decade is not needed for
     * artist-filtered gameplay.
     */
    if (
      (artist || artistId) &&
      decade !== undefined
    ) {
      return res.status(400).json({
        error:
          'Artist and decade cannot be used together.',
      })
    }

    const question =
      await generateGameQuestion(
        type as QuestionType,
        difficulty as QuestionDifficulty,
        decade,
        excludedTrackIds,
        categoryId,
        artist,
        artistId,
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
        error instanceof Error
          ? error.message
          : 'Failed to generate game question.',
    })
  }
}