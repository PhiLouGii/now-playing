import type { MusicTrack } from '../music/musicProvider.js'
import { deezerMusicProvider } from '../music/deezerMusicProvider.js'
import { filterGameTracks } from '../music/musicTrackFilter.js'
import { CATEGORY_ARTISTS } from '../../data/categories/categoryArtists.js'
import { CATEGORY_FRANCHISES } from '../../data/categories/categoryFranchises.js'
import { CATEGORY_CONFIG } from '../../data/categories/categoryConfig.js'
import type { QuestionType } from '../game/gameTypes.js'

type GetCategoryTracksOptions = {
  questionType?: QuestionType
  limit?: number
  excludedTrackIds?: Set<string>
}

// ─────────────────────────────
// HELPERS
// ─────────────────────────────

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))

    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isValidCategory(categoryId: string): boolean {
  return CATEGORY_CONFIG.some((category) => category.id === categoryId)
}

// ─────────────────────────────
// CATEGORY DATA
// ─────────────────────────────

function getArtistsForCategory(categoryId: string): string[] {
  if (!(categoryId in CATEGORY_ARTISTS)) {
    return []
  }

  return [
    ...CATEGORY_ARTISTS[
      categoryId as keyof typeof CATEGORY_ARTISTS
    ],
  ]
}

function getFranchisesForCategory(categoryId: string): string[] {
  if (!(categoryId in CATEGORY_FRANCHISES)) {
    return []
  }

  return [
    ...CATEGORY_FRANCHISES[
      categoryId as keyof typeof CATEGORY_FRANCHISES
    ],
  ]
}

// ─────────────────────────────
// ARTIST SEARCH
// ─────────────────────────────

async function searchArtistTracks(
  artist: string,
  limit = 10,
): Promise<MusicTrack[]> {
  const normalizedArtist = normalize(artist)

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(
        `[CATEGORY DEBUG] Searching Deezer tracks for "${artist}" (attempt ${attempt})`,
      )

      const tracks = await deezerMusicProvider.searchTracks(artist, 50)

      const matchingTracks = tracks.filter(
        (track) => normalize(track.artist) === normalizedArtist,
      )

      const filteredTracks = filterGameTracks(
        matchingTracks,
      ).slice(0, limit)

      console.log(
        `[CATEGORY DEBUG] "${artist}" track search:`,
        {
          returned: tracks.length,
          matchingArtist: matchingTracks.length,
          playableTracks: filteredTracks.length,
          tracks: filteredTracks.map((track) => ({
            title: track.title,
            artist: track.artist,
            album: track.album,
          })),
        },
      )

      if (filteredTracks.length > 0) {
        return filteredTracks
      }

      if (attempt === 1) {
        console.warn(
          `[CATEGORY DEBUG] "${artist}" returned no usable tracks. Retrying in 400ms...`,
        )

        await sleep(400)
      }
    } catch (error) {
      console.warn(
        `[CATEGORY DEBUG] Deezer search failed for "${artist}" (attempt ${attempt}):`,
        error,
      )

      if (attempt === 1) {
        console.warn(
          `[CATEGORY DEBUG] Retrying "${artist}" in 400ms...`,
        )

        await sleep(400)
      }
    }
  }

  console.warn(
    `[CATEGORY DEBUG] "${artist}" failed after 2 attempts.`,
  )

  return []
}

// ─────────────────────────────
// FRANCHISE SEARCH
// ─────────────────────────────

async function searchFranchiseTracks(
  franchise: string,
  limit = 10,
): Promise<MusicTrack[]> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(
        `[CATEGORY DEBUG] Searching Deezer for franchise "${franchise}" (attempt ${attempt})`,
      )

      const tracks = await deezerMusicProvider.searchTracks(
        `"${franchise}"`,
        50,
      )

      const filteredTracks = filterGameTracks(
        tracks,
      ).slice(0, limit)

      console.log(
        `[CATEGORY DEBUG] "${franchise}" franchise search:`,
        {
          returned: tracks.length,
          playableTracks: filteredTracks.length,
          tracks: filteredTracks.map((track) => ({
            title: track.title,
            artist: track.artist,
            album: track.album,
          })),
        },
      )

      if (filteredTracks.length > 0) {
        return filteredTracks
      }

      if (attempt === 1) {
        console.warn(
          `[CATEGORY DEBUG] "${franchise}" returned no usable tracks. Retrying in 400ms...`,
        )

        await sleep(400)
      }
    } catch (error) {
      console.warn(
        `[CATEGORY DEBUG] Deezer franchise search failed for "${franchise}" (attempt ${attempt}):`,
        error,
      )

      if (attempt === 1) {
        console.warn(
          `[CATEGORY DEBUG] Retrying "${franchise}" in 400ms...`,
        )

        await sleep(400)
      }
    }
  }

  console.warn(
    `[CATEGORY DEBUG] "${franchise}" failed after 2 attempts.`,
  )

  return []
}

// ─────────────────────────────
// ARTIST-BASED CATEGORY POOL
// ─────────────────────────────

async function getArtistCategoryTracks(
  categoryId: string,
  limit: number,
  excludedTrackIds: Set<string>,
): Promise<MusicTrack[]> {
  const artists = getArtistsForCategory(categoryId)

  if (artists.length === 0) {
    throw new Error(
      `Category "${categoryId}" does not have any configured artists.`,
    )
  }

  const selectedArtists = shuffle(artists).slice(0, 16)

  console.log(
    `[CATEGORY DEBUG] ${categoryId} selected artists:`,
    selectedArtists,
  )

  const trackGroups: MusicTrack[][] = []

  for (const artist of selectedArtists) {
    const tracks = await searchArtistTracks(artist, 10)

    console.log(
      `[CATEGORY DEBUG] ${artist} -> ${tracks.length} tracks`,
    )

    trackGroups.push(tracks)

    // Keep requests sequential and give Deezer some breathing room.
    await sleep(150)
  }

  return buildUniqueTrackPool(
    trackGroups,
    limit,
    excludedTrackIds,
  )
}

// ─────────────────────────────
// FRANCHISE-BASED CATEGORY POOL
// ─────────────────────────────

async function getFranchiseCategoryTracks(
  categoryId: string,
  limit: number,
  excludedTrackIds: Set<string>,
): Promise<MusicTrack[]> {
  const franchises = getFranchisesForCategory(categoryId)

  if (franchises.length === 0) {
    throw new Error(
      `Category "${categoryId}" does not have any configured franchises.`,
    )
  }

  const selectedFranchises = shuffle(franchises).slice(0, 12)

  console.log(
    `[CATEGORY DEBUG] ${categoryId} selected franchises:`,
    selectedFranchises,
  )

  const trackGroups: MusicTrack[][] = []

  for (const franchise of selectedFranchises) {
    const tracks = await searchFranchiseTracks(franchise, 10)

    console.log(
      `[CATEGORY DEBUG] ${franchise} -> ${tracks.length} tracks`,
    )

    trackGroups.push(tracks)

    // Keep requests sequential and give Deezer some breathing room.
    await sleep(150)
  }

  return buildUniqueTrackPool(
    trackGroups,
    limit,
    excludedTrackIds,
  )
}

// ─────────────────────────────
// UNIQUE TRACK POOL
// ─────────────────────────────

function buildUniqueTrackPool(
  trackGroups: MusicTrack[][],
  limit: number,
  excludedTrackIds: Set<string>,
): MusicTrack[] {
  const seen = new Set<string>()
  const uniqueTracks: MusicTrack[] = []

  for (const group of trackGroups) {
    for (const track of group) {
      if (excludedTrackIds.has(track.id)) {
        continue
      }

      const key = `${normalize(track.title)}::${normalize(track.artist)}`

      if (seen.has(key)) {
        continue
      }

      seen.add(key)
      uniqueTracks.push(track)
    }
  }

  const result = shuffle(uniqueTracks).slice(0, limit)

  console.log(
    `[CATEGORY DEBUG] Final category pool:`,
    {
      requested: limit,
      tracksFound: trackGroups.reduce(
        (total, group) => total + group.length,
        0,
      ),
      unique: uniqueTracks.length,
      returned: result.length,
    },
  )

  return result
}

// ─────────────────────────────
// PUBLIC API
// ─────────────────────────────

export async function getCategoryTracks(
  categoryId: string,
  options: GetCategoryTracksOptions = {},
): Promise<MusicTrack[]> {
  const {
    questionType = 'name-the-song',
    limit = 60,
    excludedTrackIds = new Set<string>(),
  } = options

  if (!isValidCategory(categoryId)) {
    throw new Error(`Unknown category: ${categoryId}`)
  }

  if (questionType !== 'name-the-song') {
    throw new Error(
      `Category "${categoryId}" does not currently support "${questionType}".`,
    )
  }

  const tracks =
    categoryId === 'disney-nick'
      ? await getFranchiseCategoryTracks(
          categoryId,
          limit,
          excludedTrackIds,
        )
      : await getArtistCategoryTracks(
          categoryId,
          limit,
          excludedTrackIds,
        )

  if (tracks.length < 4) {
    console.warn(
      `Category "${categoryId}" does not currently have enough tracks for "${questionType}". Found ${tracks.length}.`,
    )
  }

  return tracks
}

