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
      typeof req.query.difficulty === 'string'
        ? req.query.difficulty
        : 'medium'

    const decade =
      typeof req.query.decade === 'string'
        ? Number(req.query.decade)
        : undefined

    const categoryId =
      typeof req.query.category === 'string'
        ? req.query.category.trim()
        : undefined

    const artist =
      typeof req.query.artist === 'string'
        ? req.query.artist.trim()
        : undefined

    const artistId =
      typeof req.query.artistId === 'string'
        ? req.query.artistId.trim()
        : undefined

    const theme =
      typeof req.query.theme === 'string'
        ? req.query.theme.trim()
        : undefined

    const excludeParam =
      typeof req.query.exclude === 'string'
        ? req.query.exclude
        : ''

    const excludedTrackIds =
      excludeParam
        ? excludeParam
            .split(',')
            .map(
              id => id.trim(),
            )
            .filter(Boolean)
        : []


    /*
     * -----------------------------------------------------
     * BASIC VALIDATION
     * -----------------------------------------------------
     */

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


    if (
      theme === ''
    ) {
      return res.status(400).json({
        error:
          'Theme cannot be empty.',
      })
    }


    /*
     * -----------------------------------------------------
     * FILTER COMBINATIONS
     * -----------------------------------------------------
     *
     * Category, artist, decade and theme represent
     * different curated sources.
     *
     * Theme gameplay should therefore not be combined
     * with another curated source.
     */

    const activeFilters = [
      Boolean(categoryId),
      Boolean(artist || artistId),
      decade !== undefined,
      Boolean(theme),
    ].filter(Boolean).length


    if (
      activeFilters > 1
    ) {
      return res.status(400).json({
        error:
          'Category, artist, decade and theme cannot be combined.',
      })
    }


    /*
     * -----------------------------------------------------
     * ARTIST VALIDATION
     * -----------------------------------------------------
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


    if (
      artist &&
      !artistId
    ) {
      return res.status(400).json({
        error:
          'Artist ID is required for Play by Artist.',
      })
    }


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
     * -----------------------------------------------------
     * GAME QUESTION
     * -----------------------------------------------------
     */

    const question =
      await generateGameQuestion(
        type as QuestionType,
        difficulty as QuestionDifficulty,
        decade,
        excludedTrackIds,
        categoryId,
        artist,
        artistId,
        theme,
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