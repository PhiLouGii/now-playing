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
 * The cache stores the result of the Deezer lookup.
 *
 * IMPORTANT:
 *
 * A cached catalogue must NEVER be handed directly to
 * question-generation code because that code may filter,
 * shuffle, or otherwise create derived arrays from it.
 *
 * Every caller receives a fresh array and fresh track
 * objects.
 */

const artistCatalogueCache =
  new Map<
    string,
    Promise<MusicTrack[]>
  >()


function cloneTracks(
  tracks: MusicTrack[],
): MusicTrack[] {
  return tracks.map(
    track => ({
      ...track,
      genres: [
        ...track.genres,
      ],
    }),
  )
}


async function getArtistCatalogue(
  artist: string,
  artistId: string,
): Promise<MusicTrack[]> {
  const cached =
    artistCatalogueCache.get(
      artistId,
    )

  if (cached) {
    const tracks =
      await cached

    return cloneTracks(
      tracks,
    )
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

  const normalizedArtist =
    normalizeArtistName(
      artist,
    )

  const cataloguePromise =
    (async () => {
      /*
       * First source:
       *
       * Deezer's artist top-tracks endpoint.
       *
       * This is cheap and normally gives us the most
       * useful tracks for a quiz.
       */
      let tracks =
        await deezerMusicProvider.getArtistTracks(
          artistId,
          50,
        )

      tracks =
        tracks.filter(
          isPlayableMusicTrack,
        )

      /*
       * Some artists have no playable previews in the
       * top-tracks response.
       *
       * Fall back to Deezer track search so artists such
       * as Rihanna and The Killers can still participate.
       */
      if (
        tracks.length < 4
      ) {
        try {
          console.log(
            `Artist top tracks provided only ${tracks.length} playable tracks for "${artist}". Trying Deezer artist search fallback.`,
          )

          const searchedTracks =
            await deezerMusicProvider.searchTracks(
              artist,
              50,
            )

          const fallbackTracks =
            searchedTracks
              .filter(
                isPlayableMusicTrack,
              )
              .filter(
                track =>
                  normalizeArtistName(
                    track.artist,
                  ) === normalizedArtist,
              )

          const byId =
            new Map<
              string,
              MusicTrack
            >()

          for (
            const track of tracks
          ) {
            byId.set(
              track.id,
              track,
            )
          }

          for (
            const track of fallbackTracks
          ) {
            if (
              !byId.has(
                track.id,
              )
            ) {
              byId.set(
                track.id,
                track,
              )
            }
          }

          tracks =
            Array.from(
              byId.values(),
            )
        } catch (error) {
          /*
           * The top-track result is still usable if
           * the fallback search fails.
           */
          console.warn(
            `Artist search fallback failed for "${artist}". Using top-track results.`,
            error,
          )
        }
      }

      /*
       * Final artist verification.
       *
       * This prevents a search result for a similarly
       * named artist from entering the selected artist's
       * question pool.
       */
      const artistTracks =
        tracks.filter(
          track =>
            normalizeArtistName(
              track.artist,
            ) === normalizedArtist,
        )

      /*
       * Remove duplicate songs caused by alternate
       * releases, editions, or duplicate API results.
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

      return uniqueTracks
    })()

  /*
   * Store the promise immediately so concurrent requests
   * for the same artist share the same API request.
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

    return cloneTracks(
      tracks,
    )
  } catch (error) {
    /*
     * Allow a future request to retry if Deezer failed.
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
     * The catalogue itself is cached, but this call receives
     * a fresh copy every time.
     */
    const tracks =
      await getArtistCatalogue(
        artist,
        artistId,
      )

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
     * Remove duplicate song titles caused by re-releases,
     * deluxe editions, compilations, etc.
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
   * Artist name without ID should never reach
   * the catalogue lookup.
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
   * Play by Artist gets the exact same eligible pool
   * used to choose the correct song.
   *
   * This guarantees the distractors are derived from
   * the same artist catalogue.
   */
  return generateQuestion(
    correctTrack,
    type,
    difficulty,
    decade,
    excludedTrackIds,
    categoryId,
    artist
      ? cloneTracks(
          eligibleTracks,
        )
      : undefined,
  )
}