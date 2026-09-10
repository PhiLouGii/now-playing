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

import {
  deezerMusicProvider,
} from '../music/deezerMusicProvider.js'

import type {
  MusicTrack,
} from '../music/musicProvider.js'

import {
  getReliableReleaseYear,
} from '../music/releaseYearService.js'

async function hydrateTrack(
  track: MusicTrack,
): Promise<MusicTrack> {
  try {
    const detailedTrack =
      await deezerMusicProvider.getTrackById(
        track.id,
      )

    return detailedTrack ?? track
  } catch {
    return track
  }
}

async function enrichReleaseYear(
  track: MusicTrack,
): Promise<MusicTrack> {
  const releaseYear =
    await getReliableReleaseYear(
      track,
    )

  return {
    ...track,
    releaseYear,
  }
}

async function getEligibleTracks(
  type: QuestionType,
): Promise<MusicTrack[]> {
  const discoveredTracks =
    await discoverTracks(20)

  let eligibleTracks =
    discoveredTracks.filter(
      isPlayableMusicTrack,
    )

  if (type !== 'guess-the-year') {
    return eligibleTracks
  }

  eligibleTracks =
    await Promise.all(
      eligibleTracks.map(
        hydrateTrack,
      ),
    )

  eligibleTracks =
    await Promise.all(
      eligibleTracks.map(
        enrichReleaseYear,
      ),
    )

  return eligibleTracks.filter(
    (track) =>
      track.releaseYear !== undefined,
  )
}

function pickRandomTrack(
  tracks: MusicTrack[],
): MusicTrack {
  const randomIndex =
    Math.floor(
      Math.random() * tracks.length,
    )

  return tracks[randomIndex]
}

export async function generateGameQuestion(
  type: QuestionType,
  difficulty: QuestionDifficulty,
) {
  const eligibleTracks =
    await getEligibleTracks(type)

  if (eligibleTracks.length === 0) {
    throw new Error(
      `Could not find an eligible track for question type: ${type}`,
    )
  }

  const correctTrack =
    pickRandomTrack(
      eligibleTracks,
    )

  return generateQuestion(
    correctTrack,
    type,
    difficulty,
  )
}

