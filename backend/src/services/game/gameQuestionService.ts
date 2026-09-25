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
 * ARTIST CATALOGUE CACHE
 * ---------------------------------------------------------
 *
 * The frontend sends the Deezer artist ID as a string.
 *
 * We keep that ID as a string throughout the game service.
 * Only the Deezer provider receives the numeric version
 * when it needs to call the Deezer API.
 */

const artistCatalogueCache =
  new Map<
    string,
    Promise<MusicTrack[]>
  >()


async function getArtistCatalogue(
  artistId: string,
): Promise<MusicTrack[]> {
  const cached =
    artistCatalogueCache.get(
      artistId,
    )

  if (cached) {
    return cached
  }

  const numericArtistId =
    Number(artistId)

  if (
    !Number.isInteger(
      numericArtistId,
    ) ||
    numericArtistId <= 0
  ) {
    console.warn(
      `Invalid Deezer artist ID "${artistId}".`,
    )

    return []
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
   * Store the promise immediately so concurrent
   * requests share the same catalogue request.
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
     * Allow a future request to retry if
     * Deezer failed.
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
 * The artist ID is the source of truth.
 *
 * Flow:
 *
 *   Play
 *     ↓
 *   Artist selected
 *     ↓
 *   Deezer artist ID
 *     ↓
 *   getArtistCatalogue(artistId)
 *     ↓
 *   playable artist tracks
 *
 * There is NO artist-name search here.
 */

async function getEligibleArtistTracks(
  artist: string,
  artistId: string,
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

  /*
   * Validate the ID while keeping the
   * application-level value as a string.
   */
  const numericArtistId =
    Number(artistId)

  if (
    !Number.isInteger(
      numericArtistId,
    ) ||
    numericArtistId <= 0
  ) {
    console.warn(
      `Invalid Deezer artist ID "${artistId}" for artist "${artist}".`,
    )

    return []
  }

  try {
    console.log(
      `Loading Deezer artist "${artist}" using ID ${artistId}.`,
    )

    /*
     * Get the complete artist catalogue
     * from the shared cache.
     */
    const tracks =
      await getArtistCatalogue(
        artistId,
      )

    /*
     * Keep only tracks whose credited artist
     * matches the selected artist.
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
     * Remove duplicate song titles caused by
     * re-releases, deluxe editions, compilations,
     * etc.
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
      `Found ${uniqueTracks.length} playable tracks for artist "${artist}" (ID ${artistId}).`,
    )

    return uniqueTracks
  } catch (error) {
    console.error(
      `Failed to fetch tracks for artist "${artist}" (ID ${artistId}):`,
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
  artistId?: string,
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
   * Artist gameplay requires BOTH:
   *
   *   artist
   *   artistId
   *
   * The name is used for display/filtering.
   * The ID is used to retrieve the catalogue.
   */
  else if (
    artist &&
    artistId
  ) {
    eligibleTracks =
      await getEligibleArtistTracks(
        artist,
        artistId,
        type,
        excludedTrackIds,
      )
  }

  /*
   * Artist name without ID should never
   * reach the catalogue lookup.
   */
  else if (artist) {
    throw new Error(
      `Artist ID is required for artist game: ${artist}`,
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
   * For Play by Artist, pass the complete
   * eligible artist pool so the question
   * generation service can create distractors
   * from the same artist.
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

