import type {
  MusicTrack,
} from '../music/musicProvider.js'


type DeezerArtistRef = {
  id: number
  name: string
  picture?: string
  picture_medium?: string
  picture_big?: string
}


type DeezerAlbum = {
  id: number
  title: string
  cover?: string
  cover_medium?: string
  cover_big?: string
  release_date?: string
}


type DeezerTrack = {
  id: number
  title: string
  duration?: number
  preview?: string
  explicit_lyrics?: boolean
  artist?: DeezerArtistRef
  album?: DeezerAlbum
}


type DeezerTrackListResponse = {
  data?: DeezerTrack[]
  total?: number
  next?: string
  error?: {
    type?: string
    message?: string
    code?: number
  }
}


type DeezerGenre = {
  id: number
  name: string
  picture?: string
  picture_medium?: string
  picture_big?: string
}


type DeezerGenreResponse = {
  data?: DeezerGenre[]
  error?: {
    type?: string
    message?: string
    code?: number
  }
}


type DeezerArtistListResponse = {
  data?: DeezerArtistRef[]
  total?: number
  next?: string
  error?: {
    type?: string
    message?: string
    code?: number
  }
}


const baseUrl =
  'https://api.deezer.com'


/*
 * ---------------------------------------------------------
 * REQUEST QUEUE
 * ---------------------------------------------------------
 *
 * Deezer applies a short rolling request quota.
 *
 * All requests made through this provider pass through
 * the same queue.
 */

const REQUEST_INTERVAL_MS =
  100

let nextRequestAt = 0

let requestQueue:
  Promise<void> =
  Promise.resolve()


function sleep(
  milliseconds: number,
): Promise<void> {
  return new Promise(
    resolve => {
      setTimeout(
        resolve,
        milliseconds,
      )
    },
  )
}


function enqueueRequest<T>(
  request: () => Promise<T>,
): Promise<T> {
  const execute =
    async (): Promise<T> => {
      const now =
        Date.now()

      const wait =
        Math.max(
          0,
          nextRequestAt -
            now,
        )

      if (
        wait > 0
      ) {
        await sleep(
          wait,
        )
      }

      nextRequestAt =
        Date.now() +
        REQUEST_INTERVAL_MS

      return request()
    }

  const result =
    requestQueue.then(
      execute,
      execute,
    )

  requestQueue =
    result.then(
      () => undefined,
      () => undefined,
    )

  return result
}


/*
 * ---------------------------------------------------------
 * QUOTA HANDLING
 * ---------------------------------------------------------
 */

function isQuotaError(
  error: unknown,
): boolean {
  if (
    !error ||
    typeof error !==
      'object'
  ) {
    return false
  }

  const candidate =
    error as {
      code?: number
      message?: string
    }

  return (
    candidate.code ===
      4 ||
    candidate.message
      ?.toLowerCase()
      .includes(
        'quota limit exceeded',
      ) === true
  )
}


async function fetchJson<T>(
  path: string,
): Promise<T> {
  return enqueueRequest(
    async () => {
      const url =
        `${baseUrl}${path}`

      const response =
        await fetch(url)

      const text =
        await response.text()

      if (
        !response.ok
      ) {
        throw new Error(
          `Deezer request failed (${response.status}): ${text}`,
        )
      }

      let data: T

      try {
        data =
          JSON.parse(
            text,
          ) as T
      } catch {
        throw new Error(
          `Deezer returned invalid JSON for ${path}.`,
        )
      }

      return data
    },
  )
}


async function fetchJsonWithQuotaRetry<T>(
  path: string,
  retries = 2,
): Promise<T> {
  for (
    let attempt = 0;
    attempt <= retries;
    attempt += 1
  ) {
    try {
      const response =
        await fetchJson<T>(
          path,
        )

      const responseWithError =
        response as T & {
          error?: {
            type?: string
            message?: string
            code?: number
          }
        }

      if (
        responseWithError.error &&
        isQuotaError(
          responseWithError.error,
        )
      ) {
        if (
          attempt ===
          retries
        ) {
          throw new Error(
            'Deezer quota limit exceeded after retries.',
          )
        }

        await sleep(
          5000 *
            (attempt + 1),
        )

        continue
      }

      return response
    } catch (
      error
    ) {
      if (
        !isQuotaError(
          error,
        ) ||
        attempt ===
          retries
      ) {
        throw error
      }

      await sleep(
        5000 *
          (attempt + 1),
      )
    }
  }

  throw new Error(
    'Deezer request failed.',
  )
}


/*
 * ---------------------------------------------------------
 * TRACK TRANSFORMATION
 * ---------------------------------------------------------
 */

function getArtworkUrl(
  track: DeezerTrack,
): string {
  return (
    track.album
      ?.cover_big ??
    track.album
      ?.cover_medium ??
    track.album
      ?.cover ??
    track.artist
      ?.picture_big ??
    track.artist
      ?.picture_medium ??
    track.artist
      ?.picture ??
    ''
  )
}


function getReleaseYear(
  track: DeezerTrack,
): number {
  const releaseDate =
    track.album
      ?.release_date

  if (
    !releaseDate
  ) {
    return 0
  }

  const year =
    Number(
      releaseDate.slice(
        0,
        4,
      ),
    )

  return Number.isInteger(
    year,
  )
    ? year
    : 0
}


function transformTrack(
  track: DeezerTrack,
): MusicTrack {
  return {
    id: String(
      track.id,
    ),
    title:
      track.title,
    artist:
      track.artist
        ?.name ??
      'Unknown Artist',
    album:
      track.album
        ?.title ??
      'Unknown Album',
    releaseYear:
      getReleaseYear(
        track,
      ),
    artworkUrl:
      getArtworkUrl(
        track,
      ),
    previewUrl:
      track.preview ??
      undefined,
    genres: [],
    provider:
      'deezer',
    providerId:
      String(
        track.id,
      ),
  }
}


function cleanTracks(
  tracks: DeezerTrack[],
): MusicTrack[] {
  const seen =
    new Set<string>()

  const result:
    MusicTrack[] = []

  for (
    const track of tracks
  ) {
    /*
     * Play by Artist depends on Deezer preview URLs,
     * so tracks without previews cannot participate.
     */
    if (
      !track.preview
    ) {
      continue
    }

    if (
      !track.artist
        ?.name ||
      !track.title
    ) {
      continue
    }

    const id =
      String(
        track.id,
      )

    if (
      seen.has(id)
    ) {
      continue
    }

    seen.add(id)

    result.push(
      transformTrack(
        track,
      ),
    )
  }

  return result
}


/*
 * ---------------------------------------------------------
 * SEARCH
 * ---------------------------------------------------------
 */

async function searchTracks(
  query: string,
  limit = 25,
): Promise<MusicTrack[]> {
  const encoded =
    encodeURIComponent(
      query,
    )

  const response =
    await fetchJsonWithQuotaRetry<DeezerTrackListResponse>(
      `/search?q=${encoded}&limit=${limit}`,
    )

  if (
    response.error
  ) {
    throw new Error(
      `Deezer track search error: ${
        response.error.message ??
        'Unknown error'
      }`,
    )
  }

  return cleanTracks(
    response.data ??
      [],
  )
}


/*
 * ---------------------------------------------------------
 * SINGLE TRACK
 * ---------------------------------------------------------
 */

async function getTrackById(
  id: string,
): Promise<MusicTrack | null> {
  const response =
    await fetchJsonWithQuotaRetry<DeezerTrack>(
      `/track/${encodeURIComponent(
        id,
      )}`,
    )

  if (
    !response ||
    !response.id ||
    !response.preview
  ) {
    return null
  }

  return transformTrack(
    response,
  )
}


/*
 * ---------------------------------------------------------
 * CHARTS
 * ---------------------------------------------------------
 */

async function getChartTracks(
  limit = 50,
): Promise<MusicTrack[]> {
  const response =
    await fetchJsonWithQuotaRetry<DeezerTrackListResponse>(
      `/chart/0/tracks?limit=${limit}`,
    )

  if (
    response.error
  ) {
    throw new Error(
      `Deezer chart error: ${
        response.error.message ??
        'Unknown error'
      }`,
    )
  }

  return cleanTracks(
    response.data ??
      [],
  )
}


/*
 * ---------------------------------------------------------
 * GENRES
 * ---------------------------------------------------------
 */

async function getGenres(): Promise<
  DeezerGenre[]
> {
  const response =
    await fetchJsonWithQuotaRetry<DeezerGenreResponse>(
      '/genre',
    )

  if (
    response.error
  ) {
    throw new Error(
      `Deezer genre error: ${
        response.error.message ??
        'Unknown error'
      }`,
    )
  }

  return (
    response.data ??
    []
  )
}


async function getGenreArtists(
  genreId: string,
  limit = 50,
): Promise<
  DeezerArtistRef[]
> {
  const response =
    await fetchJsonWithQuotaRetry<DeezerArtistListResponse>(
      `/genre/${encodeURIComponent(
        genreId,
      )}/artists?limit=${limit}`,
    )

  if (
    response.error
  ) {
    throw new Error(
      `Deezer genre artist error: ${
        response.error.message ??
        'Unknown error'
      }`,
    )
  }

  return (
    response.data ??
    []
  )
}


/*
 * ---------------------------------------------------------
 * ARTISTS
 * ---------------------------------------------------------
 */

async function searchArtists(
  query: string,
  limit = 5,
): Promise<
  DeezerArtistRef[]
> {
  const encoded =
    encodeURIComponent(
      query,
    )

  const response =
    await fetchJsonWithQuotaRetry<DeezerArtistListResponse>(
      `/search/artist?q=${encoded}&limit=${limit}`,
    )

  if (
    response.error
  ) {
    throw new Error(
      `Deezer artist search error: ${
        response.error.message ??
        'Unknown error'
      }`,
    )
  }

  return (
    response.data ??
    []
  )
}


/*
 * ---------------------------------------------------------
 * ARTIST TOP TRACKS
 * ---------------------------------------------------------
 */

async function getArtistTopTracks(
  artistId: string,
  limit = 50,
): Promise<MusicTrack[]> {
  const safeLimit =
    Math.min(
      Math.max(
        limit,
        1,
      ),
      100,
    )

  const response =
    await fetchJsonWithQuotaRetry<DeezerTrackListResponse>(
      `/artist/${encodeURIComponent(
        artistId,
      )}/top?limit=${safeLimit}`,
    )

  if (
    response.error
  ) {
    throw new Error(
      `Deezer artist top tracks error: ${
        response.error.message ??
        'Unknown error'
      }`,
    )
  }

  return cleanTracks(
    response.data ??
      [],
  )
}


/*
 * ---------------------------------------------------------
 * ARTIST TRACKS
 * ---------------------------------------------------------
 *
 * This intentionally uses the artist top endpoint rather
 * than walking every album.
 *
 * The game service can use searchTracks() as a fallback
 * when an artist's top endpoint contains too few playable
 * previews.
 */

async function getArtistTracks(
  artistId: string,
  limit = 50,
): Promise<MusicTrack[]> {
  const safeLimit =
    Math.min(
      Math.max(
        limit,
        1,
      ),
      100,
    )

  return getArtistTopTracks(
    artistId,
    safeLimit,
  )
}


/*
 * ---------------------------------------------------------
 * PROVIDER
 * ---------------------------------------------------------
 */

export const deezerMusicProvider =
  {
    searchTracks,
    getTrackById,
    getChartTracks,
    getGenres,
    getGenreArtists,
    searchArtists,
    getArtistTopTracks,
    getArtistTracks,
  }