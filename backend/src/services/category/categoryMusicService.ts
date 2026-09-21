import type { MusicTrack } from '../music/musicProvider.js'

import {
  deezerMusicProvider,
} from '../music/deezerMusicProvider.js'

import {
  filterGameTracks,
} from '../music/musicTrackFilter.js'

import {
  CATEGORY_ARTISTS,
} from '../../data/categories/categoryArtists.js'

import {
  CATEGORY_CONFIG,
} from '../../data/categories/categoryConfig.js'

import type {
  QuestionType,
} from '../game/gameTypes.js'

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(
    () => Math.random() - 0.5,
  )
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isSameArtist(
  first: string,
  second: string,
): boolean {
  return (
    normalize(first) ===
    normalize(second)
  )
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

function getArtistsForCategory(
  categoryId: string,
): readonly string[] {
  const artists =
    CATEGORY_ARTISTS[
      categoryId as keyof typeof CATEGORY_ARTISTS
    ]

  return artists ?? []
}

function isValidCategory(
  categoryId: string,
): boolean {
  return CATEGORY_CONFIG.some(
    (category) =>
      category.id === categoryId,
  )
}

async function searchArtistTracks(
  artist: string,
  limit = 10,
): Promise<MusicTrack[]> {
  try {
    const artistResults =
      await deezerMusicProvider.searchArtists(
        artist,
        5,
      )

    if (artistResults.length === 0) {
      console.warn(
        `No Deezer artist found for "${artist}"`,
      )

      return []
    }

    const normalizedArtist =
      normalize(artist)

    const exactMatch =
      artistResults.find(
        (result) =>
          result.name &&
          isSameArtist(
            result.name,
            artist,
          ),
      )

    const selectedArtist =
      exactMatch ??
      artistResults[0]

    if (!selectedArtist) {
      return []
    }

    const tracks =
      await deezerMusicProvider.getArtistTopTracks(
        selectedArtist.id,
        limit,
      )

    return filterGameTracks(
      tracks,
    ).filter(
      (track) =>
        normalize(track.artist) ===
        normalizedArtist,
    )
  } catch (error) {
    console.error(
      `Failed to fetch category tracks for "${artist}":`,
      error,
    )

    return []
  }
}

async function hydrateReleaseYears(
  tracks: MusicTrack[],
): Promise<MusicTrack[]> {
  return Promise.all(
    tracks.map(async (track) => {
      if (track.releaseYear !== undefined) {
        return track
      }

      try {
        const detailedTrack =
          await deezerMusicProvider.getTrackById(
            track.id,
          )

        return detailedTrack ?? track
      } catch {
        return track
      }
    }),
  )
}

function hasAnswerVariety(
  tracks: MusicTrack[],
  type: QuestionType,
): boolean {
  const values = new Set<string>()

  for (const track of tracks) {
    let value: string | undefined

    switch (type) {
      case 'name-the-song':
        value = normalize(track.title)
        break

      case 'name-the-artist':
        value = normalize(track.artist)
        break

      case 'name-the-album':
        value = normalize(track.album)
        break

      case 'guess-the-year':
        value =
          track.releaseYear !== undefined
            ? String(track.releaseYear)
            : undefined
        break
    }

    if (value) {
      values.add(value)
    }

    if (values.size >= 4) {
      return true
    }
  }

  return false
}

export async function getCategoryTracks(
  categoryId: string,
  options: {
    questionType?: QuestionType
    limit?: number
    excludedTrackIds?: Set<string>
  } = {},
): Promise<MusicTrack[]> {
  if (!isValidCategory(categoryId)) {
    throw new Error(
      `Unknown category: ${categoryId}`,
    )
  }

  const artists =
    getArtistsForCategory(
      categoryId,
    )

  if (artists.length === 0) {
    throw new Error(
      `No artists configured for category: ${categoryId}`,
    )
  }

  const limit =
    options.limit ?? 40

  const excludedTrackIds =
    options.excludedTrackIds ??
    new Set<string>()

  const selectedArtists =
    shuffle([...artists]).slice(
      0,
      Math.min(
        artists.length,
        12,
      ),
    )

  const results =
    await Promise.all(
      selectedArtists.map(
        (artist) =>
          searchArtistTracks(
            artist,
            10,
          ),
      ),
    )

  const tracks: MusicTrack[] = []

  for (const artistTracks of results) {
    for (const track of artistTracks) {
      if (
        excludedTrackIds.has(
          track.id,
        )
      ) {
        continue
      }

      const duplicate =
        tracks.some(
          (existing) =>
            isSameTrack(
              existing,
              track,
            ),
        )

      if (duplicate) {
        continue
      }

      tracks.push(track)
    }
  }

  let filteredTracks =
    shuffle(tracks)

  if (
    options.questionType ===
    'guess-the-year'
  ) {
    filteredTracks =
      await hydrateReleaseYears(
        filteredTracks,
      )

    filteredTracks =
      filteredTracks.filter(
        (track) =>
          track.releaseYear !==
          undefined,
      )
  }

  if (
    options.questionType !== undefined &&
    !hasAnswerVariety(
      filteredTracks,
      options.questionType,
    )
  ) {
    console.warn(
      `Category "${categoryId}" does not currently have enough answer variety for "${options.questionType}".`,
    )
  }

  return filteredTracks.slice(
    0,
    limit,
  )
}
