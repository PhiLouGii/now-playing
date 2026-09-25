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


function selectRestrictedSongAnswers(
  candidates: MusicTrack[],
  correctTrack: MusicTrack,
): MusicTrack[] {
  const correctTitle =
    correctTrack.title
      .trim()
      .toLowerCase()

  const seenTitles =
    new Set<string>([
      correctTitle,
    ])

  const available =
    shuffle(
      candidates,
    ).filter(
      track => {
        const title =
          track.title
            .trim()
            .toLowerCase()

        if (
          seenTitles.has(
            title,
          )
        ) {
          return false
        }

        seenTitles.add(
          title,
        )

        return true
      },
    )

  return available.slice(
    0,
    3,
  )
}


export async function generateQuestion(
  correctTrack: MusicTrack,
  type: QuestionType = 'name-the-song',
  difficulty: QuestionDifficulty = 'medium',
  decade?: number,
  excludedTrackIds: string[] = [],
  categoryId?: string,
  restrictedCandidateTracks?: MusicTrack[],
): Promise<GeneratedQuestion> {
  const excludedIds =
    new Set(
      excludedTrackIds,
    )

  /*
   * -------------------------------------------------------
   * ARTIST-SPECIFIC QUESTION
   * -------------------------------------------------------
   *
   * The candidate pool has already been restricted to
   * the selected artist by gameQuestionService.
   *
   * Make another defensive copy so this function cannot
   * accidentally mutate anything owned by the caller.
   */
  if (
    restrictedCandidateTracks &&
    restrictedCandidateTracks.length > 0
  ) {
    if (
      type !== 'name-the-song'
    ) {
      throw new Error(
        'Restricted artist questions only support the "name-the-song" type.',
      )
    }

    const candidateSnapshot =
      restrictedCandidateTracks.map(
        track => ({
          ...track,
          genres: [
            ...track.genres,
          ],
        }),
      )

    const candidates =
      candidateSnapshot.filter(
        track =>
          !excludedIds.has(
            track.id,
          ) &&
          track.id !==
            correctTrack.id,
      )

    const distractors =
      selectRestrictedSongAnswers(
        candidates,
        correctTrack,
      )

    if (
      distractors.length !== 3
    ) {
      throw new Error(
        `Could not generate exactly 3 artist-specific distractors. Found ${distractors.length}.`,
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
            distractor,
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

  /*
   * -------------------------------------------------------
   * GENERAL / CATEGORY QUESTION
   * -------------------------------------------------------
   */

  const candidates =
    categoryId
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
              type ===
              'guess-the-year',
            decade,
            questionType:
              type,
            excludedTrackIds:
              excludedIds,
          },
        )

  const distractors =
    selectDistractors(
      candidates,
      correctTrack,
      type,
      3,
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