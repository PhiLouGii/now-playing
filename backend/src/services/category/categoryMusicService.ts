import type { MusicTrack } from '../music/musicProvider.js'
import { deezerMusicProvider } from '../music/deezerMusicProvider.js'
import { filterGameTracks } from '../music/musicTrackFilter.js'
import { CATEGORY_ARTISTS } from '../../data/categories/categoryArtists.js'
import { CATEGORY_CONFIG } from '../../data/categories/categoryConfig.js'
import type { QuestionType } from '../game/gameTypes.js'

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
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
    normalize(first.title) === normalize(second.title) &&
    normalize(first.artist) === normalize(second.artist)
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

function isValidCategory(categoryId: string): boolean {
  return CATEGORY_CONFIG.some(
    category => category.id === categoryId,
  )
}

async function searchArtistTracks(
  artist: string,
  limit = 10,
): Promise<MusicTrack[]> {
  try {
    const normalizedArtist = normalize(artist)

    /*
     * First find the correct Deezer artist profile.
     *
     * Deezer can return multiple artists with the same name,
     * so prefer an exact name match.
     */
    const artistResults =
      await deezerMusicProvider.searchArtists(
        artist,
        10,
      )

    const exactMatches =
      artistResults.filter(
        result =>
          normalize(result.name ?? '') ===
          normalizedArtist,
      )

    const selectedArtist =
      exactMatches[0] ?? artistResults[0]

    if (!selectedArtist) {
      console.warn(
        `No Deezer artist found for "${artist}"`,
      )

      return []
    }

    console.log(
      `[CATEGORY DEBUG] "${artist}" selected Deezer artist:`,
      {
        id: selectedArtist.id,
        name: selectedArtist.name,
        albums: selectedArtist.nb_album,
        fans: selectedArtist.nb_fan,
        tracklist: selectedArtist.tracklist,
      },
    )

    if (!selectedArtist.tracklist) {
      console.warn(
        `No tracklist URL for Deezer artist "${artist}"`,
      )

      return []
    }

    const tracks =
      await deezerMusicProvider.getArtistTracksByUrl(
        selectedArtist.tracklist,
        50,
      )

    const matchingTracks =
      tracks.filter(
        track =>
          normalize(track.artist) ===
          normalizedArtist,
      )

    console.log(
      `[CATEGORY DEBUG] "${artist}" tracklist:`,
      {
        returned: tracks.length,
        matchingArtist: matchingTracks.length,
        tracks: matchingTracks.map(track => ({
          title: track.title,
          artist: track.artist,
          album: track.album,
        })),
      },
    )

    return filterGameTracks(
      matchingTracks,
    )
  } catch (error) {
    console.warn(
      `Failed to load category artist "${artist}":`,
      error,
    )

    return []
  }
}


async function hydrateReleaseYears(
  tracks: MusicTrack[],
): Promise<MusicTrack[]> {
  return Promise.all(
    tracks.map(async track => {
      if (track.releaseYear) {
        return track
      }

      try {
        const hydrated =
          await deezerMusicProvider.getTrackById(
            track.providerId,
          )

        return hydrated ?? track
      } catch {
        return track
      }
    }),
  )
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
    getArtistsForCategory(categoryId)

  if (!artists.length) {
    throw new Error(
      `Category "${categoryId}" has no configured artists.`,
    )
  }

  const limit = options.limit ?? 40

  const excludedTrackIds =
    options.excludedTrackIds ?? new Set<string>()

  /*
   * We don't need every configured artist on every request.
   * Shuffle the pool so repeated games don't always start
   * with the same artists.
   */
  const selectedArtists = shuffle([
    ...artists,
  ]).slice(
    0,
    Math.min(artists.length, 12),
  )
  console.log(
  `[CATEGORY DEBUG] ${categoryId} selected artists:`,
  selectedArtists,
)

  const artistResults = await Promise.all(
    selectedArtists.map(artist =>
      searchArtistTracks(artist, 10),
    ),
  )

  artistResults.forEach((tracks, index) => {
  console.log(
    `[CATEGORY DEBUG] ${selectedArtists[index]} -> ${tracks.length} tracks`,
  )
})

  const tracks: MusicTrack[] = []

  for (const artistTracks of artistResults) {
    for (const track of artistTracks) {
      if (excludedTrackIds.has(track.id)) {
        continue
      }

      const duplicate = tracks.some(existing =>
        isSameTrack(existing, track),
      )

      if (duplicate) {
        continue
      }

      tracks.push(track)
    }
  }

  let filteredTracks = shuffle(tracks)

  if (
    options.questionType === 'guess-the-year'
  ) {
    filteredTracks =
      await hydrateReleaseYears(filteredTracks)

    filteredTracks = filteredTracks.filter(
      track => track.releaseYear !== undefined,
    )
  }

  if (
    options.questionType !== undefined &&
    filteredTracks.length < 4
  ) {
    console.warn(
      `Category "${categoryId}" does not currently have enough tracks for "${options.questionType}". Found ${filteredTracks.length}.`,
    )
  }

  return filteredTracks.slice(0, limit)
}
