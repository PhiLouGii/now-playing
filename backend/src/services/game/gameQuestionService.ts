import type {
  QuestionDifficulty,
  QuestionType,
} from './gameTypes.js'

import {
  discoverTracks,
} from '../music/musicDiscoveryService.js'

import {
  generateQuestion,
} from './questionGenerationService.js'

import {
  isPlayableMusicTrack,
} from '../music/musicTrackFilter.js'

export async function generateGameQuestion(
  type: QuestionType,
  difficulty: QuestionDifficulty,
) {
  const tracks =
    await discoverTracks(20)

  const playableTracks =
    tracks.filter(
      isPlayableMusicTrack,
    )

  if (playableTracks.length === 0) {
    throw new Error(
      'Could not find a playable track',
    )
  }

  const randomIndex =
    Math.floor(
      Math.random() *
        playableTracks.length,
    )

  const correctTrack =
    playableTracks[randomIndex]

  return generateQuestion(
    correctTrack,
    type,
    difficulty,
  )
}