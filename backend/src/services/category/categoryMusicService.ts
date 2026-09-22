import type { MusicTrack } from '../music/musicProvider.js'
import { deezerMusicProvider } from '../music/deezerMusicProvider.js'
import { filterGameTracks } from '../music/musicTrackFilter.js'
import { CATEGORY_ARTISTS } from '../../data/categories/categoryArtists.js'
import { CATEGORY_CONFIG } from '../../data/categories/categoryConfig.js'
import type { QuestionType } from '../game/gameTypes.js'

type CategoryTrackOptions = {
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
): string[] {
  return CATEGORY_ARTISTS[categoryId] ?? []
}

function isValidCategory(
  categoryId: string,
): boolean {
  return CATEGORY_CONFIG.some(
    category => category.id === categoryId,
  )
}

/**
 * Search Deezer for tracks belonging to one configured artist.
 *
 * We intentionally use Deezer's normal track search here instead
 * of the artist /top endpoint.
 *
 * The artist /top endpoint has proven unreliable for several
 * artists/categories, while normal track search returns the
 * actual artist metadata with each track.
 */
async function searchArtistTracks(
  artist: string,
  limit = 10,
): Promise<MusicTrack[]> {
  try {
    console.log(
      `[CATEGORY DEBUG] Searching Deezer tracks for "${artist}"`,
    )

    const tracks =
      await deezerMusicProvider.searchTracks(
        artist,
        50,
      )

    const normalizedArtist = normalize(artist)

    const matchingTracks =
      tracks.filter(
        track =>
          normalize(track.artist) ===
          normalizedArtist,
      )

    console.log(
      `[CATEGORY DEBUG] "${artist}" track search:`,
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
    ).slice(0, limit)
  } catch (error) {
    console.warn(
      `Failed to search category artist "${artist}":`,
      error,
    )

    return []
  }
}

/**
 * Get a pool of tracks for a category.
 *
 * Category games currently support name-the-song only.
 *
 * Artists are shuffled so repeated requests do not always
 * start with the same artists.
 *
 * We intentionally query artists sequentially with a small
 * delay instead of Promise.all(). Deezer can return empty
 * search results when too many requests are fired at once.
 */
export async function getCategoryTracks(
  categoryId: string,
  options: CategoryTrackOptions = {},
): Promise<MusicTrack[]> {
  const {
    questionType = 'name-the-song',
    limit = 60,
    excludedTrackIds = new Set<string>(),
  } = options

  if (!isValidCategory(categoryId)) {
    throw new Error(
      `Unknown music category "${categoryId}".`,
    )
  }

  if (questionType !== 'name-the-song') {
    throw new Error(
      'Category games only support the "name-the-song" question type.',
    )
  }

  const artists = getArtistsForCategory(
    categoryId,
  )

  if (artists.length === 0) {
    throw new Error(
      `Category "${categoryId}" has no configured artists.`,
    )
  }

  /*
   * Query up to 16 artists.
   *
   * We have more artists configured than this, so each
   * request gets a different random selection.
   */
  const selectedArtists = shuffle(
    artists,
  ).slice(0, 16)

  console.log(
    `[CATEGORY DEBUG] ${categoryId} selected artists:`,
    selectedArtists,
  )

  const trackGroups: MusicTrack[][] = []

  /*
   * IMPORTANT:
   *
   * Do not replace this with Promise.all().
   *
   * Deezer searches work much more reliably when we avoid
   * sending 16 requests simultaneously.
   */
  for (const artist of selectedArtists) {
    const tracks = await searchArtistTracks(
      artist,
      10,
    )

    console.log(
      `[CATEGORY DEBUG] ${artist} -> ${tracks.length} tracks`,
    )

    trackGroups.push(tracks)

    /*
     * Give Deezer a small gap between requests.
     */
    await new Promise(resolve =>
      setTimeout(resolve, 150),
    )
  }

  /*
   * Flatten all artist results into one pool.
   */
  const allTracks = trackGroups.flat()

  /*
   * Remove excluded tracks first.
   */
  const availableTracks =
    allTracks.filter(
      track =>
        !excludedTrackIds.has(track.id),
    )

  /*
   * Deduplicate by normalized title + artist.
   *
   * The same song can appear multiple times in Deezer
   * search results.
   */
  const seen = new Set<string>()

  const uniqueTracks =
    availableTracks.filter(track => {
      const key =
        `${normalize(track.title)}::` +
        `${normalize(track.artist)}`

      if (seen.has(key)) {
        return false
      }

      seen.add(key)

      return true
    })

  /*
   * Shuffle the final pool so songs are not always returned
   * in the same artist/search order.
   */
  const shuffledTracks =
    shuffle(uniqueTracks)

  const result =
    shuffledTracks.slice(0, limit)

  console.log(
    `[CATEGORY DEBUG] "${categoryId}" final pool:`,
    {
      requested: limit,
      artistsQueried: selectedArtists.length,
      tracksFound: allTracks.length,
      excluded: allTracks.length - availableTracks.length,
      unique: uniqueTracks.length,
      returned: result.length,
    },
  )

  if (result.length < 4) {
    console.warn(
      `Category "${categoryId}" does not currently have enough tracks for "${questionType}". Found ${result.length}.`,
    )
  }

  return result
}
