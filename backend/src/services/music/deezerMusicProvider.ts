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

type DeezerTrackResponse = DeezerTrack

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

  const releaseYear =
    track.release_date
      ? Number(
          track.release_date.slice(
            0,
            4,
          ),
        )
      : undefined

  return {
    id: `deezer-${track.id}`,

    title: track.title,

    artist: track.artist.name,

    album: track.album.title,

    releaseYear:
      releaseYear &&
      !Number.isNaN(releaseYear)
        ? releaseYear
        : undefined,

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

    return (data.data ?? [])
      .map(transformTrack)
      .filter(
        (
          track,
        ): track is MusicTrack =>
          track !== null,
      )
  }

  async getTrackById(
    id: string,
  ): Promise<MusicTrack | null> {
    const deezerId =
      id.startsWith('deezer-')
        ? id.replace(
            'deezer-',
            '',
          )
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
      (await response.json()) as DeezerTrackResponse

    return transformTrack(data)
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

    return (data.data ?? [])
      .map(transformTrack)
      .filter(
        (
          track,
        ): track is MusicTrack =>
          track !== null,
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

    return (data.data ?? [])
      .map(transformTrack)
      .filter(
        (
          track,
        ): track is MusicTrack =>
          track !== null,
      )
  }
}

export const deezerMusicProvider =
  new DeezerMusicProvider()