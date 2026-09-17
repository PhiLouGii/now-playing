import type { MusicTrack } from './musicProvider.js'
import { deezerMusicProvider } from './deezerMusicProvider.js'
import { filterGameTracks } from './musicTrackFilter.js'

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(
    () => Math.random() - 0.5,
  )
}

function deduplicateTracks(
  tracks: MusicTrack[],
): MusicTrack[] {
  const seen = new Set<string>()

  return tracks.filter((track) => {
    const key =
      track.isrc ??
      `${track.artist}-${track.title}`.toLowerCase()

    if (seen.has(key)) {
      return false
    }

    seen.add(key)

    return true
  })
}

function limitTracksPerArtist(
  tracks: MusicTrack[],
  maxPerArtist = 2,
): MusicTrack[] {
  const artistCounts =
    new Map<string, number>()

  return shuffle(tracks).filter(
    (track) => {
      const artist =
        track.artist.toLowerCase()

      const count =
        artistCounts.get(
          artist,
        ) ?? 0

      if (
        count >= maxPerArtist
      ) {
        return false
      }

      artistCounts.set(
        artist,
        count + 1,
      )

      return true
    },
  )
}

function filterByDecade(
  tracks: MusicTrack[],
  decade: number,
): MusicTrack[] {
  const decadeEnd =
    decade + 10

  return tracks.filter(
    (track) =>
      track.releaseYear !==
        undefined &&
      track.releaseYear >=
        decade &&
      track.releaseYear <
        decadeEnd,
  )
}

async function enrichReleaseYears(
  tracks: MusicTrack[],
): Promise<MusicTrack[]> {
  return Promise.all(
    tracks.map(async (track) => {
      if (
        track.releaseYear !==
        undefined
      ) {
        return track
      }

      try {
        const detailedTrack =
          await deezerMusicProvider.getTrackById(
            track.id,
          )

        return detailedTrack ?? track
      } catch {
        return track
      }
    }),
  )
}

async function discoverFromGenres(
  target: number,
): Promise<MusicTrack[]> {
  const candidates: MusicTrack[] =
    []

  const genres =
    await deezerMusicProvider.getGenres()

  const usableGenres =
    genres.filter(
      (genre) =>
        genre.id !== undefined &&
        genre.id !== 0,
    )

  const selectedGenres =
    shuffle(usableGenres).slice(
      0,
      Math.min(
        15,
        usableGenres.length,
      ),
    )

  for (const genre of selectedGenres) {
    try {
      const artists =
        await deezerMusicProvider.getGenreArtists(
          genre.id,
          25,
        )

      const selectedArtists =
        shuffle(artists).slice(
          0,
          12,
        )

      for (const artist of selectedArtists) {
        if (!artist.id) {
          continue
        }

        try {
          const tracks =
            await deezerMusicProvider.getArtistTopTracks(
              artist.id,
              10,
            )

          candidates.push(
            ...tracks,
          )

          const unique =
            deduplicateTracks(
              candidates,
            )

          const usable =
            filterGameTracks(
              unique,
            )

          if (
            usable.length >=
            target
          ) {
            return usable
          }
        } catch (error) {
          console.error(
            `Failed to load tracks for Deezer artist ${artist.id}:`,
            error,
          )
        }
      }
    } catch (error) {
      console.error(
        `Failed to load Deezer genre ${genre.id}:`,
        error,
      )
    }
  }

  return filterGameTracks(
    deduplicateTracks(
      candidates,
    ),
  )
}

async function discoverLargePool(
  target: number,
): Promise<MusicTrack[]> {
  const candidates: MusicTrack[] =
    []

  try {
    const chartTracks =
      await deezerMusicProvider.getChartTracks(
        100,
      )

    candidates.push(
      ...chartTracks,
    )
  } catch (error) {
    console.error(
      'Failed to load Deezer chart:',
      error,
    )
  }

  try {
    const genreTracks =
      await discoverFromGenres(
        target,
      )

    candidates.push(
      ...genreTracks,
    )
  } catch (error) {
    console.error(
      'Failed to discover tracks from genres:',
      error,
    )
  }

  return filterGameTracks(
    deduplicateTracks(
      candidates,
    ),
  )
}

async function discoverTracksForDecade(
  limit: number,
  decade: number,
): Promise<MusicTrack[]> {
  const target =
    Math.max(
      limit * 2,
      40,
    )

  const candidates: MusicTrack[] =
    []

  const genres =
    await deezerMusicProvider.getGenres()

  const usableGenres =
    genres.filter(
      (genre) =>
        genre.id !== undefined &&
        genre.id !== 0,
    )

  const selectedGenres =
    shuffle(usableGenres)

  for (const genre of selectedGenres) {
    if (
      candidates.length >=
      target
    ) {
      break
    }

    try {
      const artists =
        await deezerMusicProvider.getGenreArtists(
          genre.id,
          25,
        )

      const selectedArtists =
        shuffle(artists)

      for (const artist of selectedArtists) {
        if (
          !artist.id ||
          candidates.length >=
            target
        ) {
          break
        }

        try {
          const tracks =
            await deezerMusicProvider.getArtistTopTracks(
              artist.id,
              10,
            )

          const playable =
            filterGameTracks(
              tracks,
            )

          const enriched =
            await enrichReleaseYears(
              playable,
            )

          const decadeTracks =
            filterByDecade(
              enriched,
              decade,
            )

          candidates.push(
            ...decadeTracks,
          )

          const unique =
            deduplicateTracks(
              candidates,
            )

          candidates.length = 0
          candidates.push(
            ...unique,
          )
        } catch (error) {
          console.error(
            `Failed to load tracks for Deezer artist ${artist.id}:`,
            error,
          )
        }
      }
    } catch (error) {
      console.error(
        `Failed to load Deezer genre ${genre.id}:`,
        error,
      )
    }
  }

  const unique =
    deduplicateTracks(
      candidates,
    )

  return limitTracksPerArtist(
    unique,
    2,
  ).slice(
    0,
    limit,
  )
}

export async function discoverTracks(
  limit = 20,
  decade?: number,
): Promise<MusicTrack[]> {
  if (decade !== undefined) {
    return discoverTracksForDecade(
      limit,
      decade,
    )
  }

  const targetPoolSize =
    Math.max(
      limit * 3,
      50,
    )

  const discovered =
    await discoverLargePool(
      targetPoolSize,
    )

  const usable =
    limitTracksPerArtist(
      discovered,
      2,
    )

  return shuffle(
    usable,
  ).slice(
    0,
    limit,
  )
}