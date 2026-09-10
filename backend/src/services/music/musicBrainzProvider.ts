type MusicBrainzRecording = {
  id?: string
  title?: string
  'first-release-date'?: string
}

type MusicBrainzIsrcResponse = {
  recordings?: MusicBrainzRecording[]
}

class MusicBrainzProvider {
  private readonly baseUrl =
    'https://musicbrainz.org/ws/2'

  private readonly userAgent =
    'NowPlaying/1.0 (music game metadata service)'

  async getFirstReleaseYear(
    isrc: string,
  ): Promise<number | undefined> {
    const normalizedIsrc =
      isrc.trim().toUpperCase()

    if (!normalizedIsrc) {
      return undefined
    }

    const url =
      `${this.baseUrl}/isrc/` +
      `${encodeURIComponent(normalizedIsrc)}` +
      `?fmt=json`

    const response =
      await fetch(url, {
        headers: {
          'User-Agent':
            this.userAgent,
        },
      })

    if (!response.ok) {
      throw new Error(
        `MusicBrainz API request failed: ${response.status}`,
      )
    }

    const data =
      (await response.json()) as MusicBrainzIsrcResponse

    const recording =
      data.recordings?.find(
        (item) =>
          item['first-release-date'],
      )

    const date =
      recording?.[
        'first-release-date'
      ]

    if (!date) {
      return undefined
    }

    const year = Number(
      date.slice(0, 4),
    )

    return Number.isNaN(year)
      ? undefined
      : year
  }
}

export const musicBrainzProvider =
  new MusicBrainzProvider()