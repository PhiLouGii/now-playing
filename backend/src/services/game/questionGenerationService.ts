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
          'Correct track does not have a release year',
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
          'Distractor does not have a release year',
        )
      }

      return String(track.releaseYear)

    default:
      throw new Error(
        `Unsupported question type: ${type}`,
      )
  }
}


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
 * GUESS THE YEAR DISTRACTORS
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
      `Guess the Year needs at least 3 distinct incorrect years. Found ${availableYears.length}. Expand the curated catalogue.`,
    )
  }

  return shuffle(availableYears)
    .slice(0, 3)
    .map(String)
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
): Promise<GeneratedQuestion> {
  let distractorAnswers: string[]

  if (type === 'guess-the-year') {
    console.log(
      '[Game] Generating Guess the Year options from curated catalogue.',
    )

    distractorAnswers =
      getGuessTheYearDistractors(
        correctTrack,
        curatedCatalogue,
      )
  } else {
    const excludedIds = new Set(excludedTrackIds)

    console.time('[Game] getCandidatePool')

    const candidates = categoryId
      ? await getCategoryCandidatePool(
          categoryId,
          correctTrack,
          type,
          excludedIds,
        )
      : await getCandidatePool(
          correctTrack,
          {
            requireReleaseYear: false,
            decade,
            questionType: type,
            excludedTrackIds: artistMode
              ? new Set<string>()
              : excludedIds,
          },
        )

    console.timeEnd('[Game] getCandidatePool')

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
  }

  const correctAnswer = getCorrectAnswer(
    correctTrack,
    type,
  )

  const answers = shuffle([
    correctAnswer,
    ...distractorAnswers,
  ])

  console.log(
    '[Game] Question generated successfully:',
    {
      type,
      correctAnswer,
      answerCount: answers.length,
      categoryId,
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
