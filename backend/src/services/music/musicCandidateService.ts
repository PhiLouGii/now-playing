import type { MusicTrack } from './musicProvider.js'
import { deezerMusicProvider } from './deezerMusicProvider.js'
import { lastFmMusicProvider } from './lastFmMusicProvider.js'
import { filterGameTracks } from './musicTrackFilter.js'

export type MusicCandidate = {
  track: MusicTrack
  similarity?: number
  source:
    | 'same-artist'
    | 'similar'
}

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

async function findDeezerTrack(
  title: string,
  artist: string,
): Promise<MusicTrack | null> {
  const results =
    await deezerMusicProvider.searchTracks(
      `${title} ${artist}`,
      10,
    )

  const usable =
    filterGameTracks(results)

  const exactMatch =
    usable.find(
      (track) =>
        normalize(track.title) ===
          normalize(title) &&
        normalize(track.artist) ===
          normalize(artist),
    )

  return (
    exactMatch ??
    usable[0] ??
    null
  )
}

export async function getSimilarCandidates(
  correctTrack: MusicTrack,
  limit = 10,
): Promise<MusicCandidate[]> {
  const similarTracks =
    await lastFmMusicProvider.getSimilarTracks(
      correctTrack.title,
      correctTrack.artist,
      limit,
    )

  const candidates:
    MusicCandidate[] = []

  for (const similar of similarTracks) {
    const deezerTrack =
      await findDeezerTrack(
        similar.title,
        similar.artist,
      )

    if (!deezerTrack) {
      continue
    }

    if (
      isSameTrack(
        deezerTrack,
        correctTrack,
      )
    ) {
      continue
    }

    candidates.push({
      track: deezerTrack,
      similarity:
        similar.similarity,
      source: 'similar',
    })
  }

  return candidates
}