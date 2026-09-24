import type {
  MusicProvider,
  MusicTrack,
} from './musicProvider'

type DeezerArtistRef = {
  id: number
  name?: string
  tracklist?: string
}

type DeezerAlbum = {
  id: number
  title?: string
  cover?: string
  cover_medium?: string
  cover_big?: string
  cover_xl?: string
  release_date?: string
}

type DeezerTrack = {
  id: number
  title?: string
  title_short?: string
  title_version?: string
  duration?: number
  preview?: string
  isrc?: string
  release_date?: string
  readable?: boolean

  artist?: DeezerArtistRef

  album?: DeezerAlbum
}

type DeezerSearchResponse = {
  data?: DeezerTrack[]
  total?: number
  next?: string
  prev?: string
}

type DeezerGenre = {
  id: number
  name: string
  picture?: string
  picture_small?: string
  picture_medium?: string
  picture_big?: string
  picture_xl?: string
}

type DeezerGenreResponse = {
  data?: DeezerGenre[]
}

type DeezerArtist = {
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

type DeezerArtistResponse = {
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

type DeezerAlbumResponse = {
  id: number
  title?: string
  cover?: string
  cover_medium?: string
  cover_big?: string
  cover_xl?: string
  release_date?: string

  tracks?: {
    data?: DeezerTrack[]
    next?: string
    total?: number
  }

  data?: DeezerAlbum[]
  next?: string
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

  return Number.isFinite(year)
    ? year
    : undefined
}

function transformTrack(
  track: DeezerTrack,
  fallbackAlbum?: DeezerAlbum,
): MusicTrack | null {
  const album =
    track.album ?? fallbackAlbum

  if (
    !track.id ||
    !track.title ||
    !track.artist?.name ||
    !album?.title
  ) {
    return null
  }

  return {
    id: String(track.id),

    title: track.title,

    artist:
      track.artist.name,

    album:
      album.title,

    releaseYear:
      getReleaseYear(
        track.release_date ??
          album.release_date,
      ),

    isrc:
      track.isrc,

    artworkUrl:
      album.cover_big ??
      album.cover_medium ??
      album.cover,

    previewUrl:
      track.preview,

    genres: [],

    provider:
      'deezer',

    providerId:
      String(track.id),
  }
}

export class DeezerMusicProvider
  implements MusicProvider
{
  private readonly baseUrl =
    'https://api.deezer.com'

  private async fetchJson<T>(
    url: string,
  ): Promise<T> {
    const response =
      await fetch(url)

    if (!response.ok) {
      throw new Error(
        `Deezer request failed: ${response.status} ${response.statusText}`,
      )
    }

    return response.json() as Promise<T>
  }

  private async fetchTrackDetails(
    track: MusicTrack,
  ): Promise<MusicTrack> {
    try {
      const details =
        await this.fetchJson<DeezerTrack>(
          `${this.baseUrl}/track/${track.providerId}`,
        )

      const transformed =
        transformTrack(details)

      if (!transformed) {
        return track
      }

      return {
        ...track,

        releaseYear:
          transformed.releaseYear ??
          track.releaseYear,

        artworkUrl:
          transformed.artworkUrl ??
          track.artworkUrl,

        isrc:
          transformed.isrc ??
          track.isrc,

        previewUrl:
          transformed.previewUrl ??
          track.previewUrl,

        album:
          transformed.album ||
          track.album,
      }
    } catch {
      return track
    }
  }

  private async enrichTracks(
    tracks: MusicTrack[],
  ): Promise<MusicTrack[]> {
    return Promise.all(
      tracks.map(
        (track) =>
          this.fetchTrackDetails(
            track,
          ),
      ),
    )
  }

  async searchTracks(
    query: string,
    limit = 25,
  ): Promise<MusicTrack[]> {
    const encodedQuery =
      encodeURIComponent(query)

    const url =
      `${this.baseUrl}/search?q=${encodedQuery}&limit=${limit}`

    const data =
      await this.fetchJson<DeezerSearchResponse>(
        url,
      )

    const tracks =
      (data.data ?? [])
        .map((track) =>
          transformTrack(track),
        )
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
    try {
      const track =
        await this.fetchJson<DeezerTrack>(
          `${this.baseUrl}/track/${id}`,
        )

      return transformTrack(
        track,
      )
    } catch {
      return null
    }
  }

  async enrichReleaseYears(
    tracks: MusicTrack[],
  ): Promise<MusicTrack[]> {
    return this.enrichTracks(
      tracks,
    )
  }

  async getChartTracks(
    limit = 50,
  ): Promise<MusicTrack[]> {
    const url =
      `${this.baseUrl}/chart/0/tracks?limit=${limit}`

    const data =
      await this.fetchJson<DeezerSearchResponse>(
        url,
      )

    const tracks =
      (data.data ?? [])
        .map((track) =>
          transformTrack(track),
        )
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

  async getGenres(): Promise<
    DeezerGenre[]
  > {
    const data =
      await this.fetchJson<DeezerGenreResponse>(
        `${this.baseUrl}/genre`,
      )

    return data.data ?? []
  }

  async getGenreArtists(
    genreId: number,
    limit = 25,
  ): Promise<DeezerArtist[]> {
    const url =
      `${this.baseUrl}/genre/${genreId}/artists?limit=${limit}`

    const data =
      await this.fetchJson<{
        data?: DeezerArtist[]
      }>(url)

    return data.data ?? []
  }

  async searchArtists(
    query: string,
    limit = 25,
  ): Promise<DeezerArtist[]> {
    const encodedQuery =
      encodeURIComponent(query)

    const url =
      `${this.baseUrl}/search/artist?q=${encodedQuery}&limit=${limit}`

    const data =
      await this.fetchJson<{
        data?: DeezerArtist[]
      }>(url)

    return data.data ?? []
  }

  async getArtistTracks(
    artistId: number,
    limit = 100,
  ): Promise<MusicTrack[]> {
    const MAX_ALBUM_PAGES = 10
    const MAX_ALBUMS = 100
    const MAX_TRACK_PAGES_PER_ALBUM = 10

    const ALBUM_PAGE_SIZE = 100
    const TRACK_PAGE_SIZE = 100

    const allTracks: MusicTrack[] = []

    const seenTrackIds =
      new Set<string>()

    const seenAlbumIds =
      new Set<number>()

    let nextAlbumsUrl =
      `${this.baseUrl}/artist/${artistId}/albums?limit=${ALBUM_PAGE_SIZE}`

    let albumPages = 0

    while (
      nextAlbumsUrl &&
      albumPages < MAX_ALBUM_PAGES &&
      seenAlbumIds.size < MAX_ALBUMS &&
      allTracks.length < limit
    ) {
      const albumResponse =
        await this.fetchJson<DeezerAlbumResponse>(
          nextAlbumsUrl,
        )

      const albums =
        albumResponse.data ?? []

      for (const album of albums) {
        if (
          seenAlbumIds.has(
            album.id,
          )
        ) {
          continue
        }

        seenAlbumIds.add(
          album.id,
        )

        let nextTracksUrl =
          `${this.baseUrl}/album/${album.id}/tracks?limit=${TRACK_PAGE_SIZE}`

        let trackPages = 0

        while (
          nextTracksUrl &&
          trackPages <
            MAX_TRACK_PAGES_PER_ALBUM &&
          allTracks.length < limit
        ) {
          const trackResponse =
            await this.fetchJson<DeezerSearchResponse>(
              nextTracksUrl,
            )

          const tracks =
            trackResponse.data ?? []

          for (const track of tracks) {
            const trackId =
              String(track.id)

            if (
              seenTrackIds.has(
                trackId,
              )
            ) {
              continue
            }

            /*
             * IMPORTANT:
             *
             * Tracks returned by
             * /album/{id}/tracks do not
             * reliably contain the full
             * album object.
             *
             * We already know which album
             * we requested, so pass that
             * album into transformTrack().
             */
            const transformed =
              transformTrack(
                track,
                album,
              )

            if (!transformed) {
              continue
            }

            seenTrackIds.add(
              trackId,
            )

            allTracks.push(
              transformed,
            )

            if (
              allTracks.length >=
              limit
            ) {
              break
            }
          }

          nextTracksUrl =
            trackResponse.next ??
            ''

          trackPages += 1
        }

        if (
          allTracks.length >=
          limit
        ) {
          break
        }
      }

      nextAlbumsUrl =
        albumResponse.next ??
        ''

      albumPages += 1
    }

    console.log(
      `Fetched ${allTracks.length} tracks from ${seenAlbumIds.size} albums for Deezer artist ${artistId}.`,
    )

    return this.enrichTracks(
      allTracks.slice(
        0,
        limit,
      ),
    )
  }

  async getArtistTopTracks(
    artistId: number,
    limit = 50,
  ): Promise<MusicTrack[]> {
    const url =
      `${this.baseUrl}/artist/${artistId}/top?limit=${limit}`

    const data =
      await this.fetchJson<DeezerSearchResponse>(
        url,
      )

    const tracks =
      (data.data ?? [])
        .map((track) =>
          transformTrack(track),
        )
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

