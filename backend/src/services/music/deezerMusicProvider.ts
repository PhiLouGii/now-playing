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
    artistId: string,
    limit = 100,
  ): Promise<MusicTrack[]> {
    console.log(
      `Loading Deezer artist catalogue using ID ${artistId}.`,
    )

    const allTracks: MusicTrack[] = []
    const seenTrackIds =
      new Set<string>()

    /*
     * ---------------------------------------------------------
     * ALBUM CATALOGUE
     * ---------------------------------------------------------
     */

    try {
      const albumsResponse =
        await this.fetchJson<DeezerSearchResponse>(
          `${this.baseUrl}/artist/${artistId}/albums?limit=100`,
        )

      /*
       * The artist albums endpoint returns album objects,
       * not track objects, so use the dedicated album response
       * shape here.
       */
      const albums =
        albumsResponse.data ?? []

      for (const albumRef of albums) {
        const albumId =
          albumRef.id

        try {
          const album =
            await this.fetchJson<DeezerAlbumResponse>(
              `${this.baseUrl}/album/${albumId}`,
            )

          const albumTracks =
            album.tracks?.data ?? []

          for (
            const track of albumTracks
          ) {
            const transformed =
              transformTrack(
                track,
                album,
              )

            if (!transformed) {
              continue
            }

            const trackId =
              transformed.providerId ??
              transformed.id

            if (
              seenTrackIds.has(
                trackId,
              )
            ) {
              continue
            }

            seenTrackIds.add(
              trackId,
            )

            allTracks.push(
              transformed,
            )
          }
        } catch (error) {
          console.warn(
            `Failed to load Deezer album ${albumId}:`,
            error,
          )
        }

        /*
         * Don't build an unnecessarily huge catalogue.
         * The game only needs a reasonable pool of songs.
         */
        if (
          allTracks.length >=
          limit
        ) {
          break
        }
      }

      console.log(
        `Fetched ${allTracks.length} tracks from ${albums.length} albums for Deezer artist ${artistId}.`,
      )
    } catch (error) {
      console.warn(
        `Failed to load album catalogue for Deezer artist ${artistId}:`,
        error,
      )
    }

    /*
     * ---------------------------------------------------------
     * TOP TRACK SUPPLEMENT
     * ---------------------------------------------------------
     *
     * Important:
     * We supplement whenever the album catalogue is small.
     *
     * Rihanna was returning 1 album track, so a simple
     * "if length === 0" fallback was not enough.
     */

    if (
      allTracks.length < 20
    ) {
      try {
        const topResponse =
          await this.fetchJson<DeezerSearchResponse>(
            `${this.baseUrl}/artist/${artistId}/top?limit=50`,
          )

        const topTracks =
          topResponse.data ?? []

        console.log(
          `Fallback returned ${topTracks.length} top tracks for Deezer artist ${artistId}.`,
        )

        for (
          const track of topTracks
        ) {
          const transformed =
            transformTrack(track)

          if (!transformed) {
            continue
          }

          const trackId =
            transformed.providerId ??
            transformed.id

          if (
            seenTrackIds.has(
              trackId,
            )
          ) {
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
      } catch (error) {
        console.warn(
          `Failed to load top tracks for Deezer artist ${artistId}:`,
          error,
        )
      }
    }

    /*
     * ---------------------------------------------------------
     * RELEASE YEAR ENRICHMENT
     * ---------------------------------------------------------
     */

    const tracks =
      allTracks.slice(
        0,
        limit,
      )

    const enrichedTracks =
      await this.enrichReleaseYears(
        tracks,
      )

    console.log(
      `Fetched ${enrichedTracks.length} total tracks for Deezer artist ${artistId}.`,
    )

    return enrichedTracks
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