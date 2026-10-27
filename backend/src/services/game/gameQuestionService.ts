
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

import {
  getCategoryTracks,
} from '../category/categoryMusicService.js'

import {
  db,
} from '../../config/firebase.js'


/*
 * =========================================================
 * NORMALIZATION HELPERS
 * =========================================================
 */

function normalizeArtistName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[()[\]{}'’"`]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}


/*
 * =========================================================
 * CATALOGUE CACHES
 * =========================================================
 */

const artistCatalogueCache =
  new Map<string, Promise<MusicTrack[]>>()

const themeCatalogueCache =
  new Map<string, Promise<MusicTrack[]>>()

const curatedArtistCatalogueCache =
  new Map<string, Promise<MusicTrack[]>>()


function cloneTracks(tracks: MusicTrack[]): MusicTrack[] {
  return tracks.map(track => ({
    ...track,
    genres: [...track.genres],
  }))
}


function getTrackKey(track: MusicTrack): string {
  return `${normalizeArtistName(track.title)}::${normalizeArtistName(track.artist)}`
}


function deduplicateTracks(
  tracks: MusicTrack[],
): MusicTrack[] {
  const seen = new Set<string>()

  return tracks.filter(track => {
    const key = getTrackKey(track)

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}


/*
 * =========================================================
 * GENERAL ARTIST CATALOGUE
 * =========================================================
 *
 * Used for artists without a curated Firestore catalogue.
 */

async function getArtistCatalogue(
  artist: string,
  artistId: string,
): Promise<MusicTrack[]> {
  const cached = artistCatalogueCache.get(artistId)

  if (cached) {
    return cloneTracks(await cached)
  }

  const numericArtistId = Number(artistId)

  if (
    !Number.isInteger(numericArtistId) ||
    numericArtistId <= 0
  ) {
    console.warn(
      `Invalid Deezer artist ID "${artistId}".`,
    )

    return []
  }

  const normalizedArtist =
    normalizeArtistName(artist)

  const cataloguePromise =
    (async (): Promise<MusicTrack[]> => {
      let tracks =
        await deezerMusicProvider.getArtistDiscography(
          artistId,
        )

      tracks = tracks.filter(isPlayableMusicTrack)

      console.log(
        `Artist discography provided ${tracks.length} playable tracks for "${artist}".`,
      )

      if (tracks.length < 10) {
        try {
          console.log(
            `Expanding artist catalogue for "${artist}".`,
          )

          const [
            additionalTracks,
            searchedTracks,
          ] = await Promise.all([
            deezerMusicProvider.getArtistTopTracks(
              artistId,
              100,
            ),
            deezerMusicProvider.searchTracks(
              artist,
              50,
            ),
          ])

          const byId =
            new Map<string, MusicTrack>()

          for (const track of tracks) {
            byId.set(track.id, track)
          }

          for (const track of [
            ...additionalTracks,
            ...searchedTracks,
          ]) {
            if (
              isPlayableMusicTrack(track) &&
              normalizeArtistName(track.artist) ===
                normalizedArtist &&
              !byId.has(track.id)
            ) {
              byId.set(track.id, track)
            }
          }

          tracks = Array.from(byId.values())

          console.log(
            `Expanded artist catalogue to ${tracks.length} playable tracks for "${artist}".`,
          )
        } catch (error) {
          console.warn(
            `Artist catalogue expansion failed for "${artist}". Using available discography results.`,
            error,
          )
        }
      }

      const artistTracks = tracks.filter(
        track =>
          normalizeArtistName(track.artist) ===
          normalizedArtist,
      )

      return deduplicateTracks(artistTracks)
    })()

  artistCatalogueCache.set(
    artistId,
    cataloguePromise,
  )

  try {
    const tracks = await cataloguePromise

    if (tracks.length === 0) {
      artistCatalogueCache.delete(artistId)
    }

    return cloneTracks(tracks)
  } catch (error) {
    artistCatalogueCache.delete(artistId)
    throw error
  }
}


/*
 * =========================================================
 * NORMAL TRACK HELPERS
 * =========================================================
 */

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
    await getReliableReleaseYear(track)

  return {
    ...track,
    releaseYear,
  }
}


/*
 * =========================================================
 * NORMAL / DECADE GAME
 * =========================================================
 */

async function getEligibleTracks(
  type: QuestionType,
  decade?: number,
  excludedTrackIds: string[] = [],
): Promise<MusicTrack[]> {
  const maxAttempts = 3
  const excludedIds = new Set(excludedTrackIds)

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    const discoveredTracks =
      await discoverTracks(20, decade)

    let eligibleTracks =
      discoveredTracks
        .filter(isPlayableMusicTrack)
        .filter(
          track =>
            !excludedIds.has(track.id) &&
            !excludedIds.has(
              String(track.providerId ?? ''),
            ),
        )

    if (type !== 'guess-the-year') {
      if (eligibleTracks.length > 0) {
        return eligibleTracks
      }
    } else {
      eligibleTracks = await Promise.all(
        eligibleTracks.map(hydrateTrack),
      )

      eligibleTracks = await Promise.all(
        eligibleTracks.map(enrichReleaseYear),
      )

      eligibleTracks = eligibleTracks.filter(
        track => track.releaseYear !== undefined,
      )

      if (eligibleTracks.length > 0) {
        return eligibleTracks
      }
    }

    console.log(
      `No eligible tracks found for ${
        decade ?? 'any era'
      }. Retrying (${attempt}/${maxAttempts})...`,
    )
  }

  return []
}


/*
 * =========================================================
 * CATEGORY GAME
 * =========================================================
 */

async function getEligibleCategoryTracks(
  categoryId: string,
  type: QuestionType,
  excludedTrackIds: string[] = [],
): Promise<MusicTrack[]> {
  if (type !== 'name-the-song') {
    throw new Error(
      'Category games only support the "name-the-song" question type.',
    )
  }

  const excludedIds = new Set(excludedTrackIds)
  const maxAttempts = 3

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    const tracks = await getCategoryTracks(
      categoryId,
      {
        questionType: 'name-the-song',
        limit: 40,
        excludedTrackIds: excludedIds,
      },
    )

    const playableTracks = tracks
      .filter(isPlayableMusicTrack)
      .filter(
        track =>
          !excludedIds.has(track.id) &&
          !excludedIds.has(
            String(track.providerId ?? ''),
          ),
      )

    if (playableTracks.length > 0) {
      return playableTracks
    }

    console.log(
      `No playable tracks found for category "${categoryId}". Retrying (${attempt}/${maxAttempts})...`,
    )
  }

  return []
}


/*
 * =========================================================
 * FIRESTORE SONG DOCUMENT
 * =========================================================
 */

type CatalogueSongDocument = {
  title?: string
  artist?: string
  album?: string
  year?: number | null
  era?: string
  genres?: string[]
  themes?: string[]
  provider?: string
  providerSongId?: string
  artistKey?: string
}


/*
 * =========================================================
 * SHARED FIRESTORE CATALOGUE LOADER
 * =========================================================
 *
 * Used by curated artist catalogues.
 *
 * Firestore stores the selected tracks.
 * Deezer supplies the actual playable track data.
 *
 * No artist discography fallback is performed here.
 */

async function loadCuratedArtistCatalogue(
  artistKey: string,
  expectedArtist: string,
): Promise<MusicTrack[]> {
  const snapshot = await db
    .collection('songs')
    .where('artistKey', '==', artistKey)
    .get()

  if (snapshot.empty) {
    console.warn(
      `No curated songs found for "${expectedArtist}". Run its seeder first.`,
    )

    return []
  }

  const documents = snapshot.docs
    .map(doc => doc.data() as CatalogueSongDocument)
    .filter(song => {
      return (
        song.artistKey === artistKey &&
        song.provider === 'deezer' &&
        Boolean(song.providerSongId) &&
        Boolean(song.title) &&
        normalizeArtistName(song.artist ?? '') ===
          normalizeArtistName(expectedArtist)
      )
    })

  console.log(
    `Found ${documents.length} curated ${expectedArtist} songs in Firestore. Hydrating previews.`,
  )

  const hydratedTracks = await Promise.all(
    documents.map(async song => {
      try {
        const track =
          await deezerMusicProvider.getTrackById(
            String(song.providerSongId),
          )

        if (!track) {
          return null
        }

        if (
          !isPlayableMusicTrack(track) ||
          normalizeArtistName(track.title) !==
            normalizeArtistName(song.title ?? '') ||
          normalizeArtistName(track.artist) !==
            normalizeArtistName(expectedArtist)
        ) {
          console.warn(
            `Skipped mismatched ${expectedArtist} record: "${song.title}" (${song.providerSongId}).`,
          )

          return null
        }

        return track
      } catch (error) {
        console.warn(
          `Could not load ${expectedArtist} song "${song.title}" (${song.providerSongId}).`,
          error,
        )

        return null
      }
    }),
  )

  const playableTracks = deduplicateTracks(
    hydratedTracks.filter(
      (track): track is MusicTrack => track !== null,
    ),
  )

  console.log(
    `${expectedArtist} curated catalogue loaded: ${playableTracks.length} playable unique tracks.`,
  )

  return playableTracks
}


/*
 * =========================================================
 * CURATED ARTIST CATALOGUES
 * =========================================================
 */

function getCuratedArtistCatalogue(
  artistKey: string,
  expectedArtist: string,
): Promise<MusicTrack[]> {
  let cataloguePromise =
    curatedArtistCatalogueCache.get(artistKey)

  if (!cataloguePromise) {
    cataloguePromise = loadCuratedArtistCatalogue(
      artistKey,
      expectedArtist,
    )

    curatedArtistCatalogueCache.set(
      artistKey,
      cataloguePromise,
    )

    cataloguePromise.catch(() => {
      if (
        curatedArtistCatalogueCache.get(artistKey) ===
        cataloguePromise
      ) {
        curatedArtistCatalogueCache.delete(artistKey)
      }
    })
  }

  return cataloguePromise
}


function getDrakeCatalogue(): Promise<MusicTrack[]> {
  return getCuratedArtistCatalogue(
    'drake',
    'Drake',
  )
}


function getChrisBrownCatalogue(): Promise<MusicTrack[]> {
  return getCuratedArtistCatalogue(
    'chrisbrown',
    'Chris Brown',
  )
}


/*
 * =========================================================
 * THEME CATALOGUE
 * =========================================================
 */

async function loadThemeCatalogue(
  theme: string,
): Promise<MusicTrack[]> {
  const snapshot = await db
    .collection('songs')
    .where('themes', 'array-contains', theme)
    .get()

  if (snapshot.empty) {
    console.warn(
      `No songs found in Firestore for theme "${theme}".`,
    )

    return []
  }

  const documents = snapshot.docs
    .map(doc => doc.data() as CatalogueSongDocument)
    .filter(
      song =>
        song.provider === 'deezer' &&
        Boolean(song.providerSongId),
    )

  console.log(
    `Found ${documents.length} Firestore songs for theme "${theme}". Hydrating catalogue.`,
  )

  const hydratedTracks = await Promise.all(
    documents.map(async song => {
      try {
        const track =
          await deezerMusicProvider.getTrackById(
            String(song.providerSongId),
          )

        if (
          !track ||
          !isPlayableMusicTrack(track)
        ) {
          return null
        }

        return track
      } catch (error) {
        console.warn(
          `Failed to hydrate theme song "${song.title}" (${song.providerSongId}).`,
          error,
        )

        return null
      }
    }),
  )

  const playableTracks = deduplicateTracks(
    hydratedTracks.filter(
      (track): track is MusicTrack => track !== null,
    ),
  )

  console.log(
    `Theme "${theme}" catalogue loaded: ${playableTracks.length} playable unique tracks.`,
  )

  return playableTracks
}


async function getEligibleThemeTracks(
  theme: string,
  type: QuestionType,
  excludedTrackIds: string[] = [],
): Promise<MusicTrack[]> {
  if (type !== 'name-the-song') {
    throw new Error(
      'Theme games currently only support the "name-the-song" question type.',
    )
  }

  let cataloguePromise =
    themeCatalogueCache.get(theme)

  if (!cataloguePromise) {
    cataloguePromise = loadThemeCatalogue(theme)

    themeCatalogueCache.set(
      theme,
      cataloguePromise,
    )

    cataloguePromise.catch(() => {
      if (
        themeCatalogueCache.get(theme) ===
        cataloguePromise
      ) {
        themeCatalogueCache.delete(theme)
      }
    })
  }

  const catalogue = await cataloguePromise
  const excludedIds = new Set(excludedTrackIds)

  return catalogue.filter(
    track =>
      !excludedIds.has(track.id) &&
      !excludedIds.has(
        String(track.providerId ?? ''),
      ),
  )
}


/*
 * =========================================================
 * PLAY BY ARTIST
 * =========================================================
 */

async function getEligibleArtistTracks(
  artist: string,
  artistId: string | undefined,
  type: QuestionType,
  excludedTrackIds: string[] = [],
): Promise<MusicTrack[]> {
  if (type !== 'name-the-song') {
    throw new Error(
      'Play by Artist only supports the "name-the-song" question type.',
    )
  }

  const normalizedArtist =
    normalizeArtistName(artist)

  const excludedIds = new Set(excludedTrackIds)

  try {
    let tracks: MusicTrack[]

    /*
     * CURATED ARTIST CATALOGUES
     *
     * These do not depend on Deezer artist IDs.
     */

    if (normalizedArtist === 'drake') {
      console.log(
        'Loading Drake from the curated Firestore catalogue.',
      )

      tracks = await getDrakeCatalogue()
    } else if (normalizedArtist === 'chris brown') {
      console.log(
        'Loading Chris Brown from the curated Firestore catalogue.',
      )

      tracks = await getChrisBrownCatalogue()
    } else {
      /*
       * GENERAL ARTIST CATALOGUE
       */

      if (
        !artistId ||
        !/^\d+$/.test(artistId) ||
        Number(artistId) <= 0
      ) {
        console.warn(
          `Invalid or missing Deezer artist ID "${artistId}" for artist "${artist}".`,
        )

        return []
      }

      console.log(
        `Loading Deezer artist "${artist}" using ID ${artistId}.`,
      )

      tracks = await getArtistCatalogue(
        artist,
        artistId,
      )
    }

    const artistTracks = tracks
      .filter(
        track =>
          normalizeArtistName(track.artist) ===
          normalizedArtist,
      )
      .filter(
        track =>
          !excludedIds.has(track.id) &&
          !excludedIds.has(
            String(track.providerId ?? ''),
          ),
      )

    const uniqueTracks =
      deduplicateTracks(artistTracks)

    console.log(
      `Found ${uniqueTracks.length} playable tracks for artist "${artist}".`,
    )

    return uniqueTracks
  } catch (error) {
    console.error(
      `Failed to fetch tracks for artist "${artist}":`,
      error,
    )

    return []
  }
}


/*
 * =========================================================
 * RANDOM TRACK
 * =========================================================
 */

function pickRandomTrack(
  tracks: MusicTrack[],
): MusicTrack {
  const randomIndex = Math.floor(
    Math.random() * tracks.length,
  )

  return tracks[randomIndex]
}


/*
 * =========================================================
 * GAME QUESTION GENERATION
 * =========================================================
 */

export async function generateGameQuestion(
  type: QuestionType,
  difficulty: QuestionDifficulty,
  decade?: number,
  excludedTrackIds: string[] = [],
  categoryId?: string,
  artist?: string,
  artistId?: string,
  theme?: string,
) {
  let eligibleTracks: MusicTrack[]

  /*
   * THEME FILTER
   */

  if (theme) {
    eligibleTracks = await getEligibleThemeTracks(
      theme,
      type,
      excludedTrackIds,
    )
  }

  /*
   * CATEGORY FILTER
   */

  else if (categoryId) {
    eligibleTracks = await getEligibleCategoryTracks(
      categoryId,
      type,
      excludedTrackIds,
    )
  }

  /*
   * ARTIST FILTER
   */

  else if (artist) {
    eligibleTracks = await getEligibleArtistTracks(
      artist,
      artistId,
      type,
      excludedTrackIds,
    )
  }

  /*
   * NORMAL GAME
   */

  else {
    eligibleTracks = await getEligibleTracks(
      type,
      decade,
      excludedTrackIds,
    )
  }

  /*
   * NO VALID TRACK
   */

  if (eligibleTracks.length === 0) {
    if (theme) {
      throw new Error(
        `Could not find an eligible playable track for theme: ${theme}`,
      )
    }

    if (categoryId) {
      throw new Error(
        `Could not find an eligible playable track for category: ${categoryId}`,
      )
    }

    if (artist) {
      throw new Error(
        `Could not find an eligible track for artist: ${artist}`,
      )
    }

    throw new Error(
      `Could not find an eligible track for question type: ${type}`,
    )
  }

  /*
   * CHOOSE CORRECT SONG
   */

  const correctTrack = pickRandomTrack(
    eligibleTracks,
  )

  /*
   * GENERATE QUESTION
   */

  return generateQuestion(
    correctTrack,
    type,
    difficulty,
    decade,
    excludedTrackIds,
    categoryId,
    Boolean(artist),
  )
}
