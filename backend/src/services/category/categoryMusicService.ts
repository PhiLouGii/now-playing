import type { MusicTrack } from '../music/musicProvider.js'
import { deezerMusicProvider } from '../music/deezerMusicProvider.js'
import { filterGameTracks } from '../music/musicTrackFilter.js'
import { CATEGORY_ARTISTS } from '../../data/categories/categoryArtists.js'
import {
  CATEGORY_FRANCHISES,
  type CategoryFranchise,
} from '../../data/categories/categoryFranchises.js'
import { CATEGORY_CONFIG } from '../../data/categories/categoryConfig.js'
import type { QuestionType } from '../game/gameTypes.js'
import { db } from '../../config/firebase.js'

type GetCategoryTracksOptions = {
  questionType?: QuestionType
  limit?: number
  excludedTrackIds?: Set<string>
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))

    ;[copy[index], copy[randomIndex]] = [
      copy[randomIndex],
      copy[index],
    ]
  }

  return copy
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[()[\]{}]/g, ' ')
    .replace(/[:'"’“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function isValidCategory(categoryId: string): boolean {
  return CATEGORY_CONFIG.some((category) => category.id === categoryId)
}

function getArtistsForCategory(categoryId: string): string[] {
  const artists =
    CATEGORY_ARTISTS[categoryId as keyof typeof CATEGORY_ARTISTS]

  return artists ? [...artists] : []
}

function getFranchisesForCategory(
  categoryId: string,
): CategoryFranchise[] {
  return CATEGORY_FRANCHISES[categoryId] ?? []
}

function buildTrackKey(track: MusicTrack): string {
  return `${normalize(track.title)}::${normalize(track.artist)}`
}

async function searchArtistTracks(
  artist: string,
  limit = 10,
): Promise<MusicTrack[]> {
  const normalizedArtist = normalize(artist)

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const tracks = await deezerMusicProvider.searchTracks(
        artist,
        50,
      )

      const matchingTracks = tracks.filter(
        (track) => normalize(track.artist) === normalizedArtist,
      )

      const filteredTracks = filterGameTracks(matchingTracks).slice(
        0,
        limit,
      )

      if (filteredTracks.length > 0) {
        return filteredTracks
      }

      if (attempt === 1) {
        await sleep(400)
      }
    } catch {
      if (attempt === 1) {
        await sleep(400)
      }
    }
  }

  return []
}

async function searchAlbumTracks(
  albumName: string,
  limit = 10,
): Promise<MusicTrack[]> {
  const normalizedAlbum = normalize(albumName)

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const tracks = await deezerMusicProvider.searchTracks(
        albumName,
        50,
      )

      const matchingTracks = tracks.filter(
        (track) => normalize(track.album) === normalizedAlbum,
      )

      const filteredTracks = filterGameTracks(matchingTracks).slice(
        0,
        limit,
      )

      if (filteredTracks.length > 0) {
        return filteredTracks
      }

      if (attempt === 1) {
        await sleep(400)
      }
    } catch {
      if (attempt === 1) {
        await sleep(400)
      }
    }
  }

  return []
}


async function getArtistCategoryTracks(
  categoryId: string,
  limit: number,
  excludedTrackIds: Set<string>,
): Promise<MusicTrack[]> {
  const artists = getArtistsForCategory(categoryId)

  if (artists.length === 0) {
    throw new Error(
      `No artists configured for category "${categoryId}".`,
    )
  }

  // Search artists concurrently instead of waiting for each one.
  const selectedArtists = shuffle(artists).slice(0, 16)

  const results = await Promise.allSettled(
    selectedArtists.map((artist) => searchArtistTracks(artist, 10)),
  )

  const trackGroups = results
    .filter(
      (result): result is PromiseFulfilledResult<MusicTrack[]> =>
        result.status === 'fulfilled',
    )
    .map((result) => result.value)
    .filter((tracks) => tracks.length > 0)

  return buildUniqueTrackPool(
    trackGroups,
    limit,
    excludedTrackIds,
  )
}


async function getFranchiseCategoryTracks(
  categoryId: string,
  limit: number,
  excludedTrackIds: Set<string>,
): Promise<MusicTrack[]> {
  const franchises = getFranchisesForCategory(categoryId)

  if (franchises.length === 0) {
    throw new Error(
      `No franchises configured for category "${categoryId}".`,
    )
  }

  const selectedFranchises = shuffle(franchises).slice(0, 8)

  const trackGroups: MusicTrack[][] = []

  for (const franchise of selectedFranchises) {
    console.log(
      `[Category] ${franchise.name} — searching approved albums`,
    )

    const franchiseTracks: MusicTrack[] = []

    for (const album of franchise.albums) {
      const tracks = await searchAlbumTracks(album, 10)

      if (tracks.length > 0) {
        console.log(
          `[Category] ${franchise.name} — "${album}" → ${tracks.length} tracks`,
        )

        franchiseTracks.push(...tracks)
      } else {
        console.log(
          `[Category] ${franchise.name} — "${album}" → 0 tracks`,
        )
      }

      await sleep(150)
    }

    if (franchiseTracks.length > 0) {
      trackGroups.push(franchiseTracks)
    }
  }

  return buildUniqueTrackPool(
    trackGroups,
    limit,
    excludedTrackIds,
  )
}

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

      const key = buildTrackKey(track)

      if (seen.has(key)) {
        continue
      }

      seen.add(key)
      uniqueTracks.push(track)
    }
  }

  return shuffle(uniqueTracks).slice(0, limit)
}

async function getDisneyNickTracksFromFirebase(
  limit: number,
  excludedTrackIds: Set<string>,
): Promise<MusicTrack[]> {
  const snapshot = await db
    .collection('songs')
    .where('themes', 'array-contains', 'disney-nick')
    .get()

  const tracks: MusicTrack[] = snapshot.docs.map((doc) => {
    const data = doc.data()

    return {
      id: doc.id,
      title: data.title ?? '',
      artist: data.artist ?? '',
      album: data.album ?? '',
      releaseYear: data.year ?? undefined,
      genres: Array.isArray(data.genres) ? data.genres : [],
      provider: data.provider ?? 'deezer',
      providerId: data.providerSongId ?? doc.id,
      previewUrl: data.previewUrl ?? undefined,
      artworkUrl: data.artworkUrl ?? undefined,
    }
  })

  const filteredTracks = filterGameTracks(tracks)

  return buildUniqueTrackPool(
    [filteredTracks],
    limit,
    excludedTrackIds,
  )
}

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
    throw new Error(`Unknown category "${categoryId}".`)
  }

  if (questionType !== 'name-the-song') {
    throw new Error(
      'Category games only support the "name-the-song" question type.',
    )
  }

  const tracks =
  categoryId === 'disney-nick'
    ? await getDisneyNickTracksFromFirebase(
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
      `[Category] "${categoryId}" only produced ${tracks.length} usable tracks.`,
    )
  }

  return tracks
}
