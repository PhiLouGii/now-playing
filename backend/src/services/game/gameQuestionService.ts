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
 * =========================================================
 * ARTIST CATALOGUE CACHE
 * =========================================================
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


/*
 * =========================================================
 * ARTIST CATALOGUE
 * =========================================================
 */

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
      let tracks =
        await deezerMusicProvider.getArtistDiscography(
          artistId,
        )

      tracks =
        tracks.filter(
          isPlayableMusicTrack,
        )

      console.log(
        `Artist discography provided ${tracks.length} playable tracks for "${artist}".`,
      )


      if (
        tracks.length < 10
      ) {
        try {
          console.log(
            `Artist discography provided only ${tracks.length} playable tracks for "${artist}". Expanding with top tracks and Deezer search.`,
          )

          const additionalTracks =
            await deezerMusicProvider.getArtistTopTracks(
              artistId,
              100,
            )

          const searchedTracks =
            await deezerMusicProvider.searchTracks(
              artist,
              50,
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
            const track of additionalTracks
          ) {
            if (
              isPlayableMusicTrack(
                track,
              ) &&
              normalizeArtistName(
                track.artist,
              ) === normalizedArtist
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
          }


          for (
            const track of searchedTracks
          ) {
            if (
              isPlayableMusicTrack(
                track,
              ) &&
              normalizeArtistName(
                track.artist,
              ) === normalizedArtist
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
          }


          tracks =
            Array.from(
              byId.values(),
            )

          console.log(
            `Expanded artist catalogue to ${tracks.length} playable tracks for "${artist}".`,
          )
        } catch (error) {
          console.warn(
            `Additional artist catalogue expansion failed for "${artist}". Using discography results.`,
            error,
          )
        }
      }


      const artistTracks =
        tracks.filter(
          track =>
            normalizeArtistName(
              track.artist,
            ) === normalizedArtist,
        )


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
              seen.has(
                key,
              )
            ) {
              return false
            }

            seen.add(
              key,
            )

            return true
          },
        )

      return uniqueTracks
    })()


  artistCatalogueCache.set(
    artistId,
    cataloguePromise,
  )

  try {
    const tracks =
      await cataloguePromise

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
    artistCatalogueCache.delete(
      artistId,
    )

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
    await getReliableReleaseYear(
      track,
    )

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

  const excludedIds =
    new Set(
      excludedTrackIds,
    )

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
 * =========================================================
 * CATEGORY GAME
 * =========================================================
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
    new Set(
      excludedTrackIds,
    )

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
 * =========================================================
 * THEME GAME
 * =========================================================
 *
 * Firestore:
 *
 * songs/{songId}
 *
 * themes: [
 *   "the-breakup-department"
 * ]
 *
 * We retrieve the songs belonging to the selected theme,
 * then hydrate their Deezer track data so the game receives
 * a playable preview.
 */

type ThemeSongDocument = {
  title?: string
  artist?: string
  album?: string
  year?: number | null
  era?: string
  genres?: string[]
  themes?: string[]
  provider?: string
  providerSongId?: string
}


async function getEligibleThemeTracks(
  theme: string,
  type: QuestionType,
  excludedTrackIds: string[] = [],
): Promise<MusicTrack[]> {
  if (
    type !== 'name-the-song'
  ) {
    throw new Error(
      'Theme games currently only support the "name-the-song" question type.',
    )
  }


  const excludedIds =
    new Set(
      excludedTrackIds,
    )


  const snapshot =
    await db
      .collection('songs')
      .where(
        'themes',
        'array-contains',
        theme,
      )
      .get()


  if (
    snapshot.empty
  ) {
    console.log(
      `No songs found in Firestore for theme "${theme}".`,
    )

    return []
  }


  const documents =
    snapshot.docs
      .map(
        doc => ({
          id: doc.id,
          ...doc.data() as ThemeSongDocument,
        }),
      )
      .filter(
        song =>
          Boolean(
            song.providerSongId,
          ),
      )
      .filter(
        song =>
          !excludedIds.has(
            song.id,
          ) &&
          !excludedIds.has(
            song.providerSongId!,
          ),
      )


  /*
   * Hydrate the Firestore songs through Deezer.
   *
   * This is important because the Firestore song document
   * stores metadata/providerSongId, while the preview URL
   * comes from Deezer.
   */
  const hydratedTracks =
    await Promise.all(
      documents.map(
        async song => {
          try {
            const track =
              await deezerMusicProvider.getTrackById(
                song.providerSongId!,
              )

            if (
              !track ||
              !isPlayableMusicTrack(
                track,
              )
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
        },
      ),
    )


  const playableTracks =
    hydratedTracks.filter(
      (
        track,
      ): track is MusicTrack =>
        track !== null,
    )


  /*
   * Deduplicate songs in case a provider catalogue or
   * Firestore data contains the same song more than once.
   */
  const seen =
    new Set<string>()

  return playableTracks.filter(
    track => {
      const key =
        `${normalizeArtistName(
          track.title,
        )}::${normalizeArtistName(
          track.artist,
        )}`

      if (
        seen.has(
          key,
        )
      ) {
        return false
      }

      seen.add(
        key,
      )

      return true
    },
  )
}


/*
 * =========================================================
 * PLAY BY ARTIST
 * =========================================================
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
    new Set(
      excludedTrackIds,
    )

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
            seen.has(
              key,
            )
          ) {
            return false
          }

          seen.add(
            key,
          )

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
 * =========================================================
 * RANDOM TRACK
 * =========================================================
 */

function pickRandomTrack(
  tracks: MusicTrack[],
): MusicTrack {
  const randomIndex =
    Math.floor(
      Math.random() *
      tracks.length,
    )

  return tracks[
    randomIndex
  ]
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
  let eligibleTracks:
    MusicTrack[]


  /*
   * THEME FILTER
   */
  if (
    theme
  ) {
    eligibleTracks =
      await getEligibleThemeTracks(
        theme,
        type,
        excludedTrackIds,
      )
  }


  /*
   * CATEGORY FILTER
   */
  else if (
    categoryId
  ) {
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
   * ARTIST NAME WITHOUT ID
   */
  else if (
    artist
  ) {
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
   * NO VALID TRACK
   */
  if (
    eligibleTracks.length === 0
  ) {
    if (
      theme
    ) {
      throw new Error(
        `Could not find an eligible playable track for theme: ${theme}`,
      )
    }

    if (
      artist
    ) {
      throw new Error(
        `Could not find an eligible track for artist: ${artist}`,
      )
    }

    if (
      categoryId
    ) {
      throw new Error(
        `Could not find an eligible track for category: ${categoryId}`,
      )
    }

    throw new Error(
      `Could not find an eligible track for question type: ${type}`,
    )
  }


  /*
   * CHOOSE CORRECT SONG
   */
  const correctTrack =
    pickRandomTrack(
      eligibleTracks,
    )


  /*
   * Generate the actual question and distractors.
   */
  return generateQuestion(
    correctTrack,
    type,
    difficulty,
    decade,
    excludedTrackIds,
    categoryId,
    Boolean(
      artist,
    ),
  )
}