
import type {
  GeneratedQuestion,
  GeneratedSong,
  QuestionDifficulty,
  QuestionType,
} from './gameTypes.js'

import type {
  MusicTrack,
} from '../music/musicProvider.js'

import {
  getCandidatePool,
} from '../music/musicCandidateService.js'

import {
  selectDistractors,
} from '../music/distractorSelector.js'

import {
  getCategoryCandidatePool,
} from '../category/categoryCandidateService.js'


/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function createQuestionId(): string {
  return `question-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}


function shuffle<T>(items: T[]): T[] {
  const result = [...items]

  for (
    let index = result.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1),
    )

    const temporary = result[index]
    result[index] = result[randomIndex]
    result[randomIndex] = temporary
  }

  return result
}


function normalizeAnswer(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}


function normalizeArtistName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[()[\]{}'’"`]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}


/*
 * =========================================================
 * ANSWER RESOLUTION
 * =========================================================
 */

function getCorrectAnswer(
  track: MusicTrack,
  type: QuestionType,
): string {
  switch (type) {
    case 'name-the-song':
      return track.title

    case 'name-the-artist':
      return track.artist

    case 'name-the-album':
      return track.album

    case 'guess-the-year':
      if (track.releaseYear === undefined) {
        throw new Error(
          'Correct track does not have a release year.',
        )
      }

      return String(track.releaseYear)

    default:
      throw new Error(
        `Unsupported question type: ${type}`,
      )
  }
}


function getDistractorAnswer(
  track: MusicTrack,
  type: QuestionType,
): string {
  switch (type) {
    case 'name-the-song':
      return track.title

    case 'name-the-artist':
      return track.artist

    case 'name-the-album':
      return track.album

    case 'guess-the-year':
      if (track.releaseYear === undefined) {
        throw new Error(
          'Distractor does not have a release year.',
        )
      }

      return String(track.releaseYear)

    default:
      throw new Error(
        `Unsupported question type: ${type}`,
      )
  }
}


/*
 * =========================================================
 * SONG MAPPING
 * =========================================================
 */

function toGeneratedSong(
  track: MusicTrack,
): GeneratedSong {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    releaseYear: track.releaseYear,
    artworkUrl: track.artworkUrl ?? '',
    audioUrl: track.previewUrl,
    genres: [...track.genres],
    provider: track.provider,
    providerId: track.providerId,
  }
}


/*
 * =========================================================
 * GUESS THE YEAR
 * =========================================================
 */

function getGuessTheYearDistractors(
  correctTrack: MusicTrack,
  catalogue: MusicTrack[],
): string[] {
  if (correctTrack.releaseYear === undefined) {
    throw new Error(
      'Correct Guess the Year track has no release year.',
    )
  }

  const correctYear = correctTrack.releaseYear

  const availableYears = [
    ...new Set(
      catalogue
        .map(track => track.releaseYear)
        .filter(
          (year): year is number =>
            year !== undefined &&
            Number.isInteger(year) &&
            year !== correctYear,
        ),
    ),
  ]

  if (availableYears.length < 3) {
    throw new Error(
      `Guess the Year needs at least 3 distinct incorrect years. Found ${availableYears.length}.`,
    )
  }

  return shuffle(availableYears)
    .slice(0, 3)
    .map(String)
}


/*
 * =========================================================
 * THEME CANDIDATES
 * =========================================================
 */

function getThemeCandidates(
  catalogue: MusicTrack[],
  correctTrack: MusicTrack,
) {
  const seen = new Set<string>([
    normalizeAnswer(correctTrack.title),
  ])

  return catalogue
    .filter(track => {
      if (track.id === correctTrack.id) {
        return false
      }

      const answer = normalizeAnswer(track.title)

      if (!answer || seen.has(answer)) {
        return false
      }

      seen.add(answer)
      return true
    })
    .map(track => ({
      track,
      source: 'category' as const,
    }))
}


/*
 * =========================================================
 * ARTIST CANDIDATES
 * =========================================================
 */

function getArtistCandidates(
  catalogue: MusicTrack[],
  correctTrack: MusicTrack,
) {
  const expectedArtist = normalizeArtistName(
    correctTrack.artist,
  )

  const seen = new Set<string>([
    normalizeAnswer(correctTrack.title),
  ])

  return catalogue
    .filter(track => {
      if (
        track.id === correctTrack.id ||
        normalizeArtistName(track.artist) !== expectedArtist
      ) {
        return false
      }

      const title = normalizeAnswer(track.title)

      if (!title || seen.has(title)) {
        return false
      }

      seen.add(title)
      return true
    })
    .map(track => ({
      track,
      source: 'artist' as const,
    }))
}


/*
 * =========================================================
 * FINAL ANSWER VALIDATION
 * =========================================================
 */

function validateAnswers(
  answers: string[],
  correctAnswer: string,
): void {
  if (answers.length !== 4) {
    throw new Error(
      `A question must have exactly 4 answers. Found ${answers.length}.`,
    )
  }

  const normalizedAnswers = answers.map(
    normalizeAnswer,
  )

  if (
    normalizedAnswers.some(answer => !answer) ||
    new Set(normalizedAnswers).size !== 4
  ) {
    throw new Error(
      'Question contains empty or duplicate answer options.',
    )
  }

  if (
    !normalizedAnswers.includes(
      normalizeAnswer(correctAnswer),
    )
  ) {
    throw new Error(
      'Question options do not contain the correct answer.',
    )
  }
}


/*
 * =========================================================
 * QUESTION GENERATION
 * =========================================================
 */

export async function generateQuestion(
  correctTrack: MusicTrack,
  type: QuestionType = 'name-the-song',
  difficulty: QuestionDifficulty = 'medium',
  decade?: number,
  excludedTrackIds: string[] = [],
  categoryId?: string,
  artistMode = false,
  curatedCatalogue: MusicTrack[] = [],
  themeCatalogue: MusicTrack[] = [],
  artistCatalogue: MusicTrack[] = [],
): Promise<GeneratedQuestion> {
  let distractorAnswers: string[]

  /*
   * GUESS THE YEAR
   */

  if (type === 'guess-the-year') {
    console.log(
      '[Game] Generating Guess the Year options from curated catalogue.',
    )

    distractorAnswers = getGuessTheYearDistractors(
      correctTrack,
      curatedCatalogue,
    )
  }

  /*
   * OTHER QUESTION TYPES
   */

  else {
    const excludedIds = new Set(excludedTrackIds)

    const timerLabel =
      `[Game] Generate distractors ${createQuestionId()}`

    console.time(timerLabel)

    try {
      let candidates

      /*
       * THEME ROUND
       */

      if (themeCatalogue.length > 0) {
        candidates = getThemeCandidates(
          themeCatalogue,
          correctTrack,
        )

        console.log(
          '[Game] Using Firebase theme catalogue for distractors.',
          {
            themeTracks: themeCatalogue.length,
            candidateCount: candidates.length,
          },
        )
      }

      /*
       * CATEGORY ROUND
       */

      else if (categoryId) {
        candidates = await getCategoryCandidatePool(
          categoryId,
          correctTrack,
          type,
          excludedIds,
        )
      }

      /*
       * PLAY BY ARTIST
       */

      else if (artistMode) {
        candidates = getArtistCandidates(
          artistCatalogue,
          correctTrack,
        )

        console.log(
          '[Game] Using selected artist catalogue for distractors.',
          {
            artistTracks: artistCatalogue.length,
            candidateCount: candidates.length,
          },
        )

        if (candidates.length < 3) {
          throw new Error(
            `Not enough distinct songs in the artist catalogue. Found ${candidates.length} distractor candidates; 3 are required.`,
          )
        }
      }

      /*
       * NORMAL AND ERA ROUNDS
       */

      else {
        candidates = await getCandidatePool(
          correctTrack,
          {
            requireReleaseYear: false,
            decade,
            questionType: type,
            excludedTrackIds: excludedIds,
          },
        )
      }

      console.log(
        '[Game] Candidate count:',
        candidates.length,
      )

      const distractors = selectDistractors(
        candidates,
        correctTrack,
        type,
        3,
      )

      if (distractors.length !== 3) {
        throw new Error(
          `Could not generate exactly 3 distractors. Found ${distractors.length}.`,
        )
      }

      distractorAnswers = distractors.map(
        distractor =>
          getDistractorAnswer(
            distractor.track,
            type,
          ),
      )
    } finally {
      console.timeEnd(timerLabel)
    }
  }

  /*
   * BUILD QUESTION
   */

  const correctAnswer = getCorrectAnswer(
    correctTrack,
    type,
  )

  const answers = shuffle([
    correctAnswer,
    ...distractorAnswers,
  ])

  validateAnswers(
    answers,
    correctAnswer,
  )

  console.log(
    '[Game] Question generated successfully:',
    {
      type,
      correctAnswer,
      answerCount: answers.length,
      categoryId,
      themeCatalogueSize: themeCatalogue.length,
      artistCatalogueSize: artistCatalogue.length,
    },
  )

  return {
    id: createQuestionId(),
    type,
    song: toGeneratedSong(correctTrack),
    answers,
    correctAnswer,
    difficulty,
  }
}
