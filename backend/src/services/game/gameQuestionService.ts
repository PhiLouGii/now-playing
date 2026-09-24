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


function normalizeArtistName(
  value: string,
): string {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLowerCase()
    .replace(
      /[()[\]{}'’"`]/g,
      ' ',
    )
    .replace(
      /[^a-z0-9]+/g,
      ' ',
    )
    .replace(
      /\s+/g,
      ' ',
    )
    .trim()
}


/*
 * ---------------------------------------------------------
 * ARTIST RESOLUTION
 * ---------------------------------------------------------
 *
 * The frontend gives us an artist name such as "BTS".
 *
 * We resolve that name to the Deezer artist once.
 *
 * The promise itself is cached so simultaneous requests
 * for the same artist share the same resolution request.
 */

type DeezerArtistResult = {
  id: number
  name?: string
  picture?: string
  picture_small?: string
  picture_medium?: string
  picture_big?: string
  picture_xl?: string
  tracklist?: string
  nb_album?: number
  nb_fan?: number
}

const artistResolutionCache =
  new Map<
    string,
    Promise<DeezerArtistResult | null>
  >()


async function searchForArtist(
  artist: string,
): Promise<DeezerArtistResult | null> {
  const normalizedArtist =
    normalizeArtistName(
      artist,
    )

  const cached =
    artistResolutionCache.get(
      normalizedArtist,
    )

  if (cached) {
    return cached
  }

  const resolutionPromise =
    resolveArtistFromDeezer(
      artist,
    )

  artistResolutionCache.set(
    normalizedArtist,
    resolutionPromise,
  )

  return resolutionPromise
}


async function resolveArtistFromDeezer(
  artist: string,
): Promise<DeezerArtistResult | null> {
  const normalizedArtist =
    normalizeArtistName(
      artist,
    )

  try {
    const artists =
      await deezerMusicProvider.searchArtists(
        artist,
        10,
      )

    /*
     * An empty result simply means this request did not
     * resolve the artist. Do not retry and do not invent
     * another source of truth.
     */
    if (
      artists.length === 0
    ) {
      console.warn(
        `No Deezer artist search results for "${artist}".`,
      )

      return null
    }

    /*
     * Only accept exact normalized artist-name matches.
     */
    const exactArtists =
      artists.filter(
        candidate =>
          normalizeArtistName(
            candidate.name ?? '',
          ) === normalizedArtist,
      )

    if (
      exactArtists.length === 0
    ) {
      console.warn(
        `No exact Deezer artist match for "${artist}".`,
      )

      return null
    }

    /*
     * If multiple artists have the same name,
     * prefer the one with the largest fan count.
     */
    const selectedArtist =
      [...exactArtists].sort(
        (a, b) => {
          const fanDifference =
            (b.nb_fan ?? 0) -
            (a.nb_fan ?? 0)

          if (
            fanDifference !== 0
          ) {
            return fanDifference
          }

          return (
            (b.nb_album ?? 0) -
            (a.nb_album ?? 0)
          )
        },
      )[0]

    return selectedArtist
  } catch (error) {
    console.error(
      `Deezer artist search failed for "${artist}":`,
      error,
    )

    return null
  }
}


/*
 * ---------------------------------------------------------
 * ARTIST CATALOGUE CACHE
 * ---------------------------------------------------------
 *
 * THIS IS THE IMPORTANT FIX.
 *
 * Previously:
 *
 *   Q1 -> fetch BTS catalogue
 *   Q2 -> fetch BTS catalogue
 *   Q3 -> fetch BTS catalogue
 *   ...
 *
 * Now:
 *
 *   Q1 -> fetch BTS catalogue
 *   Q2 -> use cached BTS catalogue
 *   Q3 -> use cached BTS catalogue
 *   ...
 *
 * The cache stores the complete catalogue independently
 * from excluded track IDs.
 *
 * Exclusions belong to the individual question request,
 * not to the shared catalogue.
 */

const artistCatalogueCache =
  new Map<
    number,
    Promise<MusicTrack[]>
  >()


async function getArtistCatalogue(
  artistId: number,
): Promise<MusicTrack[]> {
  const cached =
    artistCatalogueCache.get(
      artistId,
    )

  if (cached) {
    return cached
  }

  const cataloguePromise =
    (async () => {
      const tracks =
        await deezerMusicProvider.getArtistTracks(
          artistId,
          250,
        )

      return tracks.filter(
        isPlayableMusicTrack,
      )
    })()

  /*
   * Store the promise immediately.
   *
   * If two requests arrive at nearly the same time,
   * they share the same catalogue request instead of
   * both rebuilding the catalogue.
   */
  artistCatalogueCache.set(
    artistId,
    cataloguePromise,
  )

  try {
    const tracks =
      await cataloguePromise

    /*
     * Never permanently cache an empty catalogue.
     *
     * An empty response is not useful catalogue data.
     */
    if (
      tracks.length === 0
    ) {
      artistCatalogueCache.delete(
        artistId,
      )
    }

    return tracks
  } catch (error) {
    /*
     * If the catalogue request actually fails, allow the
     * next request to make a fresh attempt.
     */
    artistCatalogueCache.delete(
      artistId,
    )

    throw error
  }
}


/*
 * ---------------------------------------------------------
 * NORMAL TRACK HELPERS
 * ---------------------------------------------------------
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
    await getReliableReleaseYear(
      track,
    )

  return {
    ...track,
    releaseYear,
  }
}


/*
 * ---------------------------------------------------------
 * NORMAL / DECADE GAME
 * ---------------------------------------------------------
 */

async function getEligibleTracks(
  type: QuestionType,
  decade?: number,
  excludedTrackIds: string[] = [],
): Promise<MusicTrack[]> {
  const maxAttempts = 3

  const excludedIds =
    new Set(excludedTrackIds)

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    const discoveredTracks =
      await discoverTracks(
        20,
        decade,
      )

    let eligibleTracks =
      discoveredTracks
        .filter(
          isPlayableMusicTrack,
        )
        .filter(
          track =>
            !excludedIds.has(
              track.id,
            ),
        )

    if (
      type !== 'guess-the-year'
    ) {
      if (
        eligibleTracks.length > 0
      ) {
        return eligibleTracks
      }
    } else {
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

      eligibleTracks =
        eligibleTracks.filter(
          track =>
            track.releaseYear !==
            undefined,
        )

      if (
        eligibleTracks.length > 0
      ) {
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
 * ---------------------------------------------------------
 * CATEGORY GAME
 * ---------------------------------------------------------
 */

async function getEligibleCategoryTracks(
  categoryId: string,
  type: QuestionType,
  excludedTrackIds: string[] = [],
): Promise<MusicTrack[]> {
  if (
    type !== 'name-the-song'
  ) {
    throw new Error(
      'Category games only support the "name-the-song" question type.',
    )
  }

  const excludedIds =
    new Set(excludedTrackIds)

  const maxAttempts = 3

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    const tracks =
      await getCategoryTracks(
        categoryId,
        {
          questionType:
            'name-the-song',
          limit: 40,
          excludedTrackIds:
            excludedIds,
        },
      )

    const playableTracks =
      tracks.filter(
        isPlayableMusicTrack,
      )

    if (
      playableTracks.length > 0
    ) {
      return playableTracks
    }

    console.log(
      `No playable tracks found for category "${categoryId}". Retrying (${attempt}/${maxAttempts})...`,
    )
  }

  return []
}


/*
 * ---------------------------------------------------------
 * PLAY BY ARTIST
 * ---------------------------------------------------------
 *
 * The selected artist is a SOURCE FILTER.
 *
 * Example:
 *
 *     Play
 *       ↓
 *     Artist
 *       ↓
 *     BTS
 *
 * The player hears a BTS song and identifies the
 * song title.
 *
 * The important distinction here is that the artist
 * catalogue is loaded ONCE and then reused.
 */

async function getEligibleArtistTracks(
  artist: string,
  type: QuestionType,
  excludedTrackIds: string[] = [],
): Promise<MusicTrack[]> {
  if (
    type !== 'name-the-song'
  ) {
    throw new Error(
      'Play by Artist only supports the "name-the-song" question type.',
    )
  }

  const normalizedArtist =
    normalizeArtistName(
      artist,
    )

  const excludedIds =
    new Set(excludedTrackIds)

  try {
    /*
     * Resolve the artist name to its Deezer ID.
     */
    const selectedArtist =
      await searchForArtist(
        artist,
      )

    if (!selectedArtist) {
      console.warn(
        `Could not resolve Deezer artist "${artist}".`,
      )

      return []
    }

    console.log(
      `Selected Deezer artist "${selectedArtist.name}" (ID ${selectedArtist.id}) for "${artist}". Fans: ${selectedArtist.nb_fan ?? 0}, albums: ${selectedArtist.nb_album ?? 0}`,
    )

    /*
     * Get the catalogue from the shared cache.
     *
     * This is the part that prevents Q2, Q3, Q4, etc.
     * from repeatedly hitting Deezer for the same artist.
     */
    const tracks =
      await getArtistCatalogue(
        selectedArtist.id,
      )

    /*
     * Keep only tracks actually credited to the selected
     * artist.
     */
    const artistTracks =
      tracks
        .filter(
          track =>
            normalizeArtistName(
              track.artist,
            ) === normalizedArtist,
        )
        .filter(
          track =>
            !excludedIds.has(
              track.id,
            ),
        )

    /*
     * Remove duplicate song titles.
     *
     * This handles re-releases, deluxe editions,
     * compilations and repeated catalogue entries.
     */
    const seen =
      new Set<string>()

    const uniqueTracks =
      artistTracks.filter(
        track => {
          const key =
            `${normalizeArtistName(
              track.title,
            )}::${normalizeArtistName(
              track.artist,
            )}`

          if (
            seen.has(key)
          ) {
            return false
          }

          seen.add(key)

          return true
        },
      )

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
 * ---------------------------------------------------------
 * RANDOM TRACK
 * ---------------------------------------------------------
 */

function pickRandomTrack(
  tracks: MusicTrack[],
): MusicTrack {
  const randomIndex =
    Math.floor(
      Math.random() *
        tracks.length,
    )

  return tracks[randomIndex]
}


/*
 * ---------------------------------------------------------
 * GAME QUESTION GENERATION
 * ---------------------------------------------------------
 */

export async function generateGameQuestion(
  type: QuestionType,
  difficulty: QuestionDifficulty,
  decade?: number,
  excludedTrackIds: string[] = [],
  categoryId?: string,
  artist?: string,
) {
  let eligibleTracks: MusicTrack[]

  /*
   * CATEGORY FILTER
   */
  if (categoryId) {
    eligibleTracks =
      await getEligibleCategoryTracks(
        categoryId,
        type,
        excludedTrackIds,
      )
  }

  /*
   * ARTIST FILTER
   *
   * Play -> Artist -> BTS
   *
   * The question remains:
   *
   * "Which song is this?"
   */
  else if (artist) {
    eligibleTracks =
      await getEligibleArtistTracks(
        artist,
        type,
        excludedTrackIds,
      )
  }

  /*
   * NORMAL GAME
   */
  else {
    eligibleTracks =
      await getEligibleTracks(
        type,
        decade,
        excludedTrackIds,
      )
  }

  /*
   * No valid track.
   */
  if (
    eligibleTracks.length === 0
  ) {
    if (artist) {
      throw new Error(
        `Could not find an eligible track for artist: ${artist}`,
      )
    }

    if (categoryId) {
      throw new Error(
        `Could not find an eligible track for category: ${categoryId}`,
      )
    }

    throw new Error(
      `Could not find an eligible track for question type: ${type}`,
    )
  }

  /*
   * Choose the actual song.
   */
  const correctTrack =
    pickRandomTrack(
      eligibleTracks,
    )

  /*
   * For Play by Artist, pass the complete eligible
   * artist pool so questionGenerationService can create
   * song-title distractors from the same artist.
   */
  return generateQuestion(
    correctTrack,
    type,
    difficulty,
    decade,
    excludedTrackIds,
    categoryId,
    artist
      ? eligibleTracks
      : undefined,
  )
}

