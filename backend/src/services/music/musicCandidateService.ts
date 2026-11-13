import type { MusicTrack } from './musicProvider.js'

import { deezerMusicProvider } from './deezerMusicProvider.js'
import { lastFmMusicProvider } from './lastFmMusicProvider.js'
import { filterGameTracks } from './musicTrackFilter.js'

import { DISCOVERY_ARTISTS } from '../../data/discoveryArtists.js'

import { artists1960s } from '../../data/eraArtists/1960s.js'
import { artists1970s } from '../../data/eraArtists/1970s.js'
import { artists1980s } from '../../data/eraArtists/1980s.js'
import { artists1990s } from '../../data/eraArtists/1990s.js'
import { artists2000s } from '../../data/eraArtists/2000s.js'
import { artists2010s } from '../../data/eraArtists/2010s.js'
import { artists2020s } from '../../data/eraArtists/2020s.js'

import type { QuestionType } from '../game/gameTypes.js'

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(
    () => Math.random() - 0.5,
  )
}

function getArtistsForDecade(
  decade: number,
): string[] {
  switch (decade) {
    case 1960:
      return artists1960s
    case 1970:
      return artists1970s
    case 1980:
      return artists1980s
    case 1990:
      return artists1990s
    case 2000:
      return artists2000s
    case 2010:
      return artists2010s
    case 2020:
      return artists2020s
    default:
      return []
  }
}

export type CandidateSource =
  | 'same-artist'
  | 'same-album'
  | 'similar'
  | 'era'
  | 'discovery'
  | 'category'
  | 'artist'

export type MusicCandidate = {
  track: MusicTrack
  source: CandidateSource
  similarity?: number
}

type CandidatePoolOptions = {
  requireReleaseYear?: boolean
  decade?: number
  excludedTrackIds?: Set<string>
  questionType?: QuestionType
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

function isExcludedTrack(
  track: MusicTrack,
  excludedTrackIds: Set<string>,
): boolean {
  return excludedTrackIds.has(track.id)
}

function addCandidate(
  candidates: MusicCandidate[],
  candidate: MusicCandidate,
  correctTrack: MusicTrack,
  excludedTrackIds: Set<string> = new Set(),
): void {
  if (
    isSameTrack(
      candidate.track,
      correctTrack,
    )
  ) {
    return
  }

  if (
    isExcludedTrack(
      candidate.track,
      excludedTrackIds,
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

function filterCandidatesByDecade(
  candidates: MusicCandidate[],
  decade: number,
): MusicCandidate[] {
  const decadeEnd = decade + 10

  return candidates.filter(
    (candidate) =>
      candidate.track.releaseYear !==
        undefined &&
      candidate.track.releaseYear >=
        decade &&
      candidate.track.releaseYear <
        decadeEnd,
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
  excludedTrackIds: Set<string> = new Set(),
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
      excludedTrackIds,
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

async function getEraCandidates(
  decade: number,
  correctTrack: MusicTrack,
  limit = 30,
  excludedTrackIds: Set<string> = new Set(),
): Promise<MusicCandidate[]> {
  const artists =
    getArtistsForDecade(decade)

  if (artists.length === 0) {
    return []
  }

  const selectedArtists =
    shuffle(artists).slice(
      0,
      Math.min(15, artists.length),
    )

  const results =
    await Promise.all(
      selectedArtists.map(
        async (artist) => {
          try {
            return await deezerMusicProvider.searchTracks(
              artist,
              10,
            )
          } catch (error) {
            console.error(
              `Failed to search Deezer for era artist ${artist}:`,
              error,
            )

            return []
          }
        },
      ),
    )

  const candidates: MusicCandidate[] = []

  for (const tracks of results) {
    const usable =
      filterGameTracks(tracks)

    for (const track of usable) {
      addCandidate(
        candidates,
        {
          track,
          source: 'era',
        },
        correctTrack,
        excludedTrackIds,
      )
    }
  }

  const hydrated =
    await hydrateCandidates(
      candidates,
    )

  return filterCandidatesByDecade(
    hydrated,
    decade,
  ).slice(0, limit)
}

function getAnswerValue(
  track: MusicTrack,
  type: QuestionType,
): string | null {
  switch (type) {
    case 'name-the-song':
      return normalize(track.title)

    case 'name-the-artist':
      return normalize(track.artist)

    case 'name-the-album':
      return normalize(track.album)

    case 'guess-the-year':
      return track.releaseYear !== undefined
        ? String(track.releaseYear)
        : null

    default:
      return null
  }
}

function hasEnoughAnswerVariety(
  candidates: MusicCandidate[],
  correctTrack: MusicTrack,
  type: QuestionType,
): boolean {
  const values = new Set<string>()

  const correctAnswer =
    getAnswerValue(
      correctTrack,
      type,
    )

  for (const candidate of candidates) {
    const value =
      getAnswerValue(
        candidate.track,
        type,
      )

    if (
      value === null ||
      value === correctAnswer
    ) {
      continue
    }

    values.add(value)

    if (values.size >= 3) {
      return true
    }
  }

  return false
}

async function getDiscoveryCandidates(
  correctTrack: MusicTrack,
  excludedTrackIds: Set<string>,
  limit = 30,
): Promise<MusicCandidate[]> {
  const artists = shuffle(
    DISCOVERY_ARTISTS.filter(
      (artist) =>
        normalize(artist) !==
        normalize(correctTrack.artist),
    ),
  )

  const candidates: MusicCandidate[] = []

  const batchSize = 10

  for (
    let index = 0;
    index < artists.length;
    index += batchSize
  ) {
    const batch = artists.slice(
      index,
      index + batchSize,
    )

    const results =
      await Promise.all(
        batch.map(async (artist) => {
          try {
            return await deezerMusicProvider.searchTracks(
              artist,
              10,
            )
          } catch (error) {
            console.error(
              `Failed to search Deezer for discovery artist ${artist}:`,
              error,
            )

            return []
          }
        }),
      )

    for (
      let resultIndex = 0;
      resultIndex < results.length;
      resultIndex++
    ) {
      const tracks =
        filterGameTracks(
          results[resultIndex],
        )

      const artist =
        batch[resultIndex]

      for (const track of tracks) {
        if (
          normalize(track.artist) !==
          normalize(artist)
        ) {
          continue
        }

        addCandidate(
          candidates,
          {
            track,
            source: 'discovery',
          },
          correctTrack,
          excludedTrackIds,
        )
      }
    }

    if (candidates.length >= limit) {
      break
    }
  }

  return candidates.slice(0, limit)
}

function filterCandidatesByRequirements(
  candidates: MusicCandidate[],
  options: CandidatePoolOptions,
): MusicCandidate[] {
  let filtered = candidates

  if (
    options.requireReleaseYear ||
    options.decade !== undefined
  ) {
    filtered = filtered.filter(
      (candidate) =>
        candidate.track.releaseYear !==
        undefined,
    )
  }

  if (options.decade !== undefined) {
    filtered =
      filterCandidatesByDecade(
        filtered,
        options.decade,
      )
  }

  if (
    options.excludedTrackIds &&
    options.excludedTrackIds.size > 0
  ) {
    filtered =
      filtered.filter(
        (candidate) =>
          !options.excludedTrackIds!.has(
            candidate.track.id,
          ),
      )
  }

  return filtered
}

export async function getCandidatePool(
  correctTrack: MusicTrack,
  options: CandidatePoolOptions = {},
): Promise<MusicCandidate[]> {
  const candidates: MusicCandidate[] = []

  const excludedTrackIds =
    options.excludedTrackIds ??
    new Set<string>()

  // ─────────────────────────────
  // 1. Same artist
  // ─────────────────────────────

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
      excludedTrackIds,
    )
  }

  // ─────────────────────────────
  // 2. Same album
  // ─────────────────────────────

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
      excludedTrackIds,
    )
  }

  // ─────────────────────────────
  // 3. Last.fm similar
  // ─────────────────────────────

  const similar =
    await getSimilarCandidates(
      correctTrack,
      10,
      excludedTrackIds,
    )

  for (const candidate of similar) {
    addCandidate(
      candidates,
      candidate,
      correctTrack,
      excludedTrackIds,
    )
  }

  // ─────────────────────────────
  // 4. Decade candidates
  // ─────────────────────────────

  if (options.decade !== undefined) {
    const eraCandidates =
      await getEraCandidates(
        options.decade,
        correctTrack,
        30,
        excludedTrackIds,
      )

    for (const candidate of eraCandidates) {
      addCandidate(
        candidates,
        candidate,
        correctTrack,
        excludedTrackIds,
      )
    }
  }

  // ─────────────────────────────
  // 5. Curated discovery fallback
  // ─────────────────────────────

  if (
    options.questionType !== undefined &&
    options.decade === undefined &&
    !hasEnoughAnswerVariety(
      candidates,
      correctTrack,
      options.questionType,
    )
  ) {
    const discoveryCandidates =
      await getDiscoveryCandidates(
        correctTrack,
        excludedTrackIds,
        30,
      )

    for (const candidate of discoveryCandidates) {
      addCandidate(
        candidates,
        candidate,
        correctTrack,
        excludedTrackIds,
      )
    }
  }

  // ─────────────────────────────
  // 6. Hydrate year-dependent pools
  // ─────────────────────────────

  if (
    options.requireReleaseYear ||
    options.decade !== undefined
  ) {
    const hydrated =
      await hydrateCandidates(
        candidates,
      )

    return filterCandidatesByRequirements(
      hydrated,
      options,
    )
  }

  return candidates
}