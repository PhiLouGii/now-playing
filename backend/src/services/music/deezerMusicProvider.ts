import type {
  MusicProvider,
  MusicTrack,
} from './musicProvider.js'

type DeezerTrack = {
  id: number
  title?: string
  isrc?: string

  artist?: {
    id?: number
    name?: string
  }

  album?: {
    id?: number
    title?: string
    cover_medium?: string
    cover_big?: string
  }

  release_date?: string
  preview?: string
  genre_id?: number
}

type DeezerSearchResponse = {
  data?: DeezerTrack[]
}

type DeezerGenre = {
  id: number
  name?: string
}

type DeezerGenreResponse = {
  data?: DeezerGenre[]
}

type DeezerArtist = {
  id: number
  name?: string
}

type DeezerArtistResponse = {
  data?: DeezerArtist[]
}

function getReleaseYear(
  releaseDate?: string,
): number | undefined {
  if (!releaseDate) {
    return undefined
  }

  const year = Number(
    releaseDate.slice(0, 4),
  )

  if (
    Number.isNaN(year) ||
    year < 1900
  ) {
    return undefined
  }

  return year
}

function transformTrack(
  track: DeezerTrack,
): MusicTrack | null {
  if (
    !track.title ||
    !track.artist?.name ||
    !track.album?.title
  ) {
    return null
  }

  return {
    id: `deezer-${track.id}`,

    title: track.title,

    artist: track.artist.name,

    album: track.album.title,

    releaseYear:
      getReleaseYear(
        track.release_date,
      ),

    isrc: track.isrc,

    artworkUrl:
      track.album.cover_big ??
      track.album.cover_medium,

    previewUrl: track.preview,

    genres: [],

    provider: 'deezer',

    providerId: String(track.id),
  }
}

class DeezerMusicProvider
  implements MusicProvider
{
  private async fetchTrackDetails(
    track: MusicTrack,
  ): Promise<MusicTrack> {
    if (track.releaseYear) {
      return track
    }

    const response =
      await fetch(
        `https://api.deezer.com/track/${track.providerId}`,
      )

    if (!response.ok) {
      console.error(
        `Failed to fetch Deezer track ${track.providerId}: ${response.status}`,
      )

      return track
    }

    const data =
      (await response.json()) as DeezerTrack

    const releaseYear =
      getReleaseYear(
        data.release_date,
      )

    if (!releaseYear) {
      return track
    }

    return {
      ...track,
      releaseYear,
    }
  }

  private async enrichTracks(
    tracks: MusicTrack[],
  ): Promise<MusicTrack[]> {
    return Promise.all(
      tracks.map((track) =>
        this.fetchTrackDetails(
          track,
        ),
      ),
    )
  }

  async searchTracks(
    query: string,
    limit = 10,
  ): Promise<MusicTrack[]> {
    const url = new URL(
      'https://api.deezer.com/search',
    )

    url.searchParams.set(
      'q',
      query,
    )

    url.searchParams.set(
      'limit',
      String(limit),
    )

    const response =
      await fetch(url)

    if (!response.ok) {
      throw new Error(
        `Deezer API request failed: ${response.status}`,
      )
    }

    const data =
      (await response.json()) as DeezerSearchResponse

    const tracks =
      (data.data ?? [])
        .map(transformTrack)
        .filter(
          (
            track,
          ): track is MusicTrack =>
            track !== null,
        )

    return this.enrichTracks(
      tracks,
    )
  }

  async getTrackById(
    id: string,
  ): Promise<MusicTrack | null> {
    const deezerId =
      id.startsWith('deezer-')
        ? id.slice(7)
        : id

    const response =
      await fetch(
        `https://api.deezer.com/track/${deezerId}`,
      )

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error(
        `Deezer API request failed: ${response.status}`,
      )
    }

    const data =
      (await response.json()) as DeezerTrack

    return transformTrack(data)
  }

  async enrichReleaseYears(
    tracks: MusicTrack[],
  ): Promise<MusicTrack[]> {
    return this.enrichTracks(
      tracks,
    )
  }

  async getChartTracks(
    limit = 100,
  ): Promise<MusicTrack[]> {
    const url = new URL(
      'https://api.deezer.com/chart/0/tracks',
    )

    url.searchParams.set(
      'limit',
      String(limit),
    )

    const response =
      await fetch(url)

    if (!response.ok) {
      throw new Error(
        `Deezer chart request failed: ${response.status}`,
      )
    }

    const data =
      (await response.json()) as DeezerSearchResponse

    const tracks =
      (data.data ?? [])
        .map(transformTrack)
        .filter(
          (
            track,
          ): track is MusicTrack =>
            track !== null,
        )

    return this.enrichTracks(
      tracks,
    )
  }

  async getGenres(): Promise<DeezerGenre[]> {
    const response =
      await fetch(
        'https://api.deezer.com/genre',
      )

    if (!response.ok) {
      throw new Error(
        `Deezer genre request failed: ${response.status}`,
      )
    }

    const data =
      (await response.json()) as DeezerGenreResponse

    return data.data ?? []
  }

  async getGenreArtists(
    genreId: number,
    limit = 25,
  ): Promise<DeezerArtist[]> {
    const url = new URL(
      `https://api.deezer.com/genre/${genreId}/artists`,
    )

    url.searchParams.set(
      'limit',
      String(limit),
    )

    const response =
      await fetch(url)

    if (!response.ok) {
      throw new Error(
        `Deezer genre artist request failed: ${response.status}`,
      )
    }

    const data =
      (await response.json()) as DeezerArtistResponse

    return data.data ?? []
  }

async searchArtists(
  query: string,
  limit = 5,
): Promise<DeezerArtist[]> {
  const url = new URL(
    'https://api.deezer.com/search/artist',
  )

  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(limit))

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Deezer artist search failed: ${response.status}`,
    )
  }

  const data =
    (await response.json()) as DeezerArtistResponse

  return data.data ?? []
}


  async getArtistTopTracks(
    artistId: number,
    limit = 10,
  ): Promise<MusicTrack[]> {
    const url = new URL(
      `https://api.deezer.com/artist/${artistId}/top`,
    )

    url.searchParams.set(
      'limit',
      String(limit),
    )

    const response =
      await fetch(url)

    if (!response.ok) {
      throw new Error(
        `Deezer artist request failed: ${response.status}`,
      )
    }

    const data =
      (await response.json()) as DeezerSearchResponse

    const tracks =
      (data.data ?? [])
        .map(transformTrack)
        .filter(
          (
            track,
          ): track is MusicTrack =>
            track !== null,
        )

    return this.enrichTracks(
      tracks,
    )
  }
}

export const deezerMusicProvider =
  new DeezerMusicProvider()