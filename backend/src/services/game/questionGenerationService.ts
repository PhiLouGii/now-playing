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


function shuffle<T>(
  items: T[],
): T[] {
  const result = [
    ...items,
  ]

  /*
   * Fisher-Yates avoids the biased random-sort
   * approach and guarantees we only shuffle this
   * question's own array.
   */
  for (
    let index = result.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
          (index + 1),
      )

    const temporary =
      result[index]

    result[index] =
      result[randomIndex]

    result[randomIndex] =
      temporary
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
      if (
        track.releaseYear ===
        undefined
      ) {
        throw new Error(
          'Correct track does not have a release year',
        )
      }

      return String(
        track.releaseYear,
      )

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
        track.releaseYear ===
        undefined
      ) {
        throw new Error(
          'Distractor does not have a release year',
        )
      }

      return String(
        track.releaseYear,
      )

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
    releaseYear:
      track.releaseYear,
    artworkUrl:
      track.artworkUrl ?? '',
    audioUrl:
      track.previewUrl,
    genres: [
      ...track.genres,
    ],
    provider:
      track.provider,
    providerId:
      track.providerId,
  }
}

export async function generateQuestion(
  correctTrack: MusicTrack,
  type: QuestionType = 'name-the-song',
  difficulty: QuestionDifficulty = 'medium',
  decade?: number,
  excludedTrackIds: string[] = [],
  categoryId?: string,
  artistMode = false,
): Promise<GeneratedQuestion> {
  const excludedIds =
    new Set(
      excludedTrackIds,
    )


  /*
   * -------------------------------------------------------
   * GENERAL / CATEGORY QUESTION
   * -------------------------------------------------------
   */

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
        requireReleaseYear:
          type === 'guess-the-year',
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

  const distractors =
    selectDistractors(
      candidates,
      correctTrack,
      type,
      3,
    )

    console.log('[Game] Correct track:', {
  title: correctTrack.title,
  artist: correctTrack.artist,
})

console.log('[Game] Distractors selected:', distractors.length)

console.log(
  '[Game] Candidate tracks:',
  candidates.map(candidate => ({
    title: candidate.track.title,
    artist: candidate.track.artist,
    source: candidate.source,
  })),
)

  if (
    distractors.length !== 3
  ) {
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
      distractor =>
        getDistractorAnswer(
          distractor.track,
          type,
        ),
    )

  const answers =
    shuffle([
      correctAnswer,
      ...distractorAnswers,
    ])

  return {
    id: createQuestionId(),
    type,
    song:
      toGeneratedSong(
        correctTrack,
      ),
    answers,
    correctAnswer,
    difficulty,
  }
}