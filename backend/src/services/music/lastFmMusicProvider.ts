import dotenv from 'dotenv'

dotenv.config()

type LastFmSimilarTrack = {
  name?: string
  match?: string
  artist?: {
    name?: string
  }
}

type LastFmSimilarResponse = {
  similartracks?: {
    track?: LastFmSimilarTrack[]
  }
}

export type SimilarTrack = {
  title: string
  artist: string
  similarity: number
}

class LastFmMusicProvider {
  async getSimilarTracks(
    title: string,
    artist: string,
    limit = 10,
  ): Promise<SimilarTrack[]> {
    const apiKey =
      process.env.LASTFM_API_KEY

    if (!apiKey) {
      throw new Error(
        'LASTFM_API_KEY is not defined',
      )
    }

    const url = new URL(
      'https://ws.audioscrobbler.com/2.0/',
    )

    url.searchParams.set(
      'method',
      'track.getSimilar',
    )

    url.searchParams.set(
      'artist',
      artist,
    )

    url.searchParams.set(
      'track',
      title,
    )

    url.searchParams.set(
      'api_key',
      apiKey,
    )

    url.searchParams.set(
      'format',
      'json',
    )

    url.searchParams.set(
      'limit',
      String(limit),
    )

    const response =
      await fetch(url, {
        headers: {
          'User-Agent':
            'NowPlaying/1.0',
        },
      })

    if (!response.ok) {
      throw new Error(
        `Last.fm API request failed: ${response.status}`,
      )
    }

    const data =
      (await response.json()) as LastFmSimilarResponse

    return (
      data.similartracks?.track ?? []
    )
      .filter(
        (track) =>
          track.name &&
          track.artist?.name,
      )
      .map((track) => ({
        title: track.name!,
        artist: track.artist!.name!,
        similarity: Number(
          track.match ?? 0,
        ),
      }))
  }
}

export const lastFmMusicProvider =
  new LastFmMusicProvider()