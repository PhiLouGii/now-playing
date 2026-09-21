import type { MusicTrack } from '../music/musicProvider.js'

import {
  getCategoryTracks,
} from './categoryMusicService.js'

import type {
  QuestionType,
} from '../game/gameTypes.js'

import type {
  MusicCandidate,
} from '../music/musicCandidateService.js'

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isSameTrack(
  first: MusicTrack,
  second: MusicTrack,
): boolean {
  return (
    normalize(first.title) ===
      normalize(second.title) &&
    normalize(first.artist) ===
      normalize(second.artist)
  )
}

export async function getCategoryCandidatePool(
  categoryId: string,
  correctTrack: MusicTrack,
  type: QuestionType,
  excludedTrackIds: Set<string> = new Set(),
): Promise<MusicCandidate[]> {
  if (type !== 'name-the-song') {
    throw new Error(
      'Category games only support the "name-the-song" question type.',
    )
  }

  const tracks =
    await getCategoryTracks(
      categoryId,
      {
        questionType: 'name-the-song',
        limit: 60,
        excludedTrackIds,
      },
    )

  const candidates: MusicCandidate[] = []

  for (const track of tracks) {
    if (
      excludedTrackIds.has(
        track.id,
      )
    ) {
      continue
    }

    if (
      isSameTrack(
        track,
        correctTrack,
      )
    ) {
      continue
    }

    const alreadyExists =
      candidates.some(
        (candidate) =>
          isSameTrack(
            candidate.track,
            track,
          ),
      )

    if (alreadyExists) {
      continue
    }

    candidates.push({
      track,
      source: 'category',
    })
  }

  return candidates
}
