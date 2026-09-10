import type { MusicTrack } from './musicProvider.js'
import { deezerMusicProvider } from './deezerMusicProvider.js'
import { lastFmMusicProvider } from './lastFmMusicProvider.js'
import { filterGameTracks } from './musicTrackFilter.js'

export type CandidateSource =
  | 'same-artist'
  | 'same-album'
  | 'similar'

export type MusicCandidate = {
  track: MusicTrack
  source: CandidateSource
  similarity?: number
}

type CandidatePoolOptions = {
  requireReleaseYear?: boolean
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

function addCandidate(
  candidates: MusicCandidate[],
  candidate: MusicCandidate,
  correctTrack: MusicTrack,
): void {
  if (
    isSameTrack(
      candidate.track,
      correctTrack,
    )
  ) {
    return
  }

  const alreadyExists =
    candidates.some(
      (existing) =>
        isSameTrack(
          existing.track,
          candidate.track,
        ),
    )

  if (alreadyExists) {
    return
  }

  candidates.push(candidate)
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

  return (
    usable.find(
      (track) =>
        normalize(track.title) ===
          normalize(title) &&
        normalize(track.artist) ===
          normalize(artist),
    ) ?? null
  )
}

async function getSameArtistCandidates(
  correctTrack: MusicTrack,
  limit = 20,
): Promise<MusicCandidate[]> {
  const results =
    await deezerMusicProvider.searchTracks(
      correctTrack.artist,
      limit,
    )

  return filterGameTracks(results)
    .filter(
      (track) =>
        normalize(track.artist) ===
        normalize(correctTrack.artist),
    )
    .filter(
      (track) =>
        !isSameTrack(
          track,
          correctTrack,
        ),
    )
    .map((track) => ({
      track,
      source: 'same-artist' as const,
    }))
}

async function getSameAlbumCandidates(
  correctTrack: MusicTrack,
  limit = 20,
): Promise<MusicCandidate[]> {
  const results =
    await deezerMusicProvider.searchTracks(
      `"${correctTrack.album}" ${correctTrack.artist}`,
      limit,
    )

  return filterGameTracks(results)
    .filter(
      (track) =>
        normalize(track.artist) ===
        normalize(correctTrack.artist),
    )
    .filter(
      (track) =>
        normalize(track.album) ===
        normalize(correctTrack.album),
    )
    .filter(
      (track) =>
        !isSameTrack(
          track,
          correctTrack,
        ),
    )
    .map((track) => ({
      track,
      source: 'same-album' as const,
    }))
}

async function getSimilarCandidates(
  correctTrack: MusicTrack,
  limit = 10,
): Promise<MusicCandidate[]> {
  const similarTracks =
    await lastFmMusicProvider.getSimilarTracks(
      correctTrack.title,
      correctTrack.artist,
      limit,
    )

  const candidates: MusicCandidate[] = []

  for (const similar of similarTracks) {
    const deezerTrack =
      await findDeezerTrack(
        similar.title,
        similar.artist,
      )

    if (!deezerTrack) {
      continue
    }

    addCandidate(
      candidates,
      {
        track: deezerTrack,
        source: 'similar',
        similarity: similar.similarity,
      },
      correctTrack,
    )
  }

  return candidates
}

async function hydrateCandidate(
  candidate: MusicCandidate,
): Promise<MusicCandidate> {
  try {
    const detailedTrack =
      await deezerMusicProvider.getTrackById(
        candidate.track.id,
      )

    if (!detailedTrack) {
      return candidate
    }

    return {
      ...candidate,
      track: detailedTrack,
    }
  } catch {
    return candidate
  }
}

async function hydrateCandidates(
  candidates: MusicCandidate[],
): Promise<MusicCandidate[]> {
  return Promise.all(
    candidates.map(
      hydrateCandidate,
    ),
  )
}

function filterCandidatesByRequirements(
  candidates: MusicCandidate[],
  options: CandidatePoolOptions,
): MusicCandidate[] {
  if (!options.requireReleaseYear) {
    return candidates
  }

  return candidates.filter(
    (candidate) =>
      candidate.track.releaseYear !==
      undefined,
  )
}

export async function getCandidatePool(
  correctTrack: MusicTrack,
  options: CandidatePoolOptions = {},
): Promise<MusicCandidate[]> {
  const candidates: MusicCandidate[] = []

  const sameArtist =
    await getSameArtistCandidates(
      correctTrack,
      20,
    )

  for (const candidate of sameArtist) {
    addCandidate(
      candidates,
      candidate,
      correctTrack,
    )
  }

  const sameAlbum =
    await getSameAlbumCandidates(
      correctTrack,
      20,
    )

  for (const candidate of sameAlbum) {
    addCandidate(
      candidates,
      candidate,
      correctTrack,
    )
  }


  const similar =
    await getSimilarCandidates(
      correctTrack,
      10,
    )

  for (const candidate of similar) {
    addCandidate(
      candidates,
      candidate,
      correctTrack,
    )
  }

  if (options.requireReleaseYear) {
    const hydratedCandidates =
      await hydrateCandidates(
        candidates,
      )

    return filterCandidatesByRequirements(
      hydratedCandidates,
      options,
    )
  }

  return candidates
}