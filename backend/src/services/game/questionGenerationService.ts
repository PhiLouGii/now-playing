import type {
  GeneratedQuestion,
  GeneratedSong,
  QuestionDifficulty,
  QuestionType,
} from './gameTypes.js'

import type { MusicTrack } from '../music/musicProvider.js'

import {
  getCandidatePool,
} from '../music/musicCandidateService.js'

import {
  selectDistractors,
} from '../music/distractorSelector.js'

function createQuestionId(): string {
  return `question-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(
    () => Math.random() - 0.5,
  )
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
      if (
        track.releaseYear === undefined
      ) {
        throw new Error(
          'Track does not have a release year',
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
      if (
        track.releaseYear === undefined
      ) {
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
  if (track.releaseYear === undefined) {
    throw new Error(
      'Track does not have a release year',
    )
  }

  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    releaseYear: track.releaseYear,
    artworkUrl:
      track.artworkUrl ?? '',
    audioUrl: track.previewUrl,
    genres: track.genres,
    provider: track.provider,
    providerId: track.providerId,
  }
}

export async function generateQuestion(
  correctTrack: MusicTrack,
  type: QuestionType = 'name-the-song',
  difficulty: QuestionDifficulty = 'medium',
): Promise<GeneratedQuestion> {
  const candidates =
    await getCandidatePool(
      correctTrack,
    )

  const distractors =
    selectDistractors(
      candidates,
      correctTrack,
      3,
    )

  if (distractors.length !== 3) {
    throw new Error(
      `Could not generate exactly 3 distractors. Found ${distractors.length}.`,
    )
  }

  const correctAnswer =
    getCorrectAnswer(
      correctTrack,
      type,
    )

  const distractorAnswers =
    distractors.map(
      (distractor) =>
        getDistractorAnswer(
          distractor.track,
          type,
        ),
    )

  const answers = shuffle([
    correctAnswer,
    ...distractorAnswers,
  ])

  return {
    id: createQuestionId(),
    type,
    song: toGeneratedSong(
      correctTrack,
    ),
    answers,
    correctAnswer,
    difficulty,
  }
}