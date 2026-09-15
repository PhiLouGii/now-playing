import type { MusicTrack } from './musicProvider.js'
import { deezerMusicProvider } from './deezerMusicProvider.js'
import { filterGameTracks } from './musicTrackFilter.js'

type DeezerArtist = {
  id: number
  name?: string
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
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

async function discoverFromGenres(
  target: number,
): Promise<MusicTrack[]> {
  const candidates: MusicTrack[] = []

  const genres =
    await deezerMusicProvider.getGenres()

  const usableGenres =
    genres.filter(
      (genre) =>
        genre.id !== undefined &&
        genre.id !== 0,
    )

  const selectedGenres =
    shuffle(usableGenres).slice(0, 8)

  for (const genre of selectedGenres) {
    const artists =
      await deezerMusicProvider.getGenreArtists(
        genre.id,
        10,
      )

    const selectedArtists =
      shuffle(artists).slice(0, 5)

    for (const artist of selectedArtists) {
      if (!artist.id) {
        continue
      }

      const tracks =
        await deezerMusicProvider.getArtistTopTracks(
          artist.id,
          10,
        )

      candidates.push(...tracks)

      const unique =
        deduplicateTracks(candidates)

      const usable =
        filterGameTracks(unique)

      if (usable.length >= target) {
        return usable
      }
    }
  }

  return filterGameTracks(
    deduplicateTracks(candidates),
  )
}

export async function discoverTracks(
  limit = 20,
): Promise<MusicTrack[]> {
  const candidates: MusicTrack[] = []

  /*
   * Start with the global Deezer chart.
   * This gives us a reliable pool immediately.
   */
  try {
    const chartTracks =
      await deezerMusicProvider.getChartTracks(
        100,
      )

    candidates.push(...chartTracks)
  } catch (error) {
    console.error(
      'Failed to load Deezer chart:',
      error,
    )
  }

  /*
   * Expand the pool using artists discovered
   * dynamically through Deezer genres.
   */
  try {
    const genreTracks =
      await discoverFromGenres(
        Math.max(limit * 3, 50),
      )

    candidates.push(...genreTracks)
  } catch (error) {
    console.error(
      'Failed to discover tracks from genres:',
      error,
    )
  }

  const unique =
    deduplicateTracks(candidates)

  const usable =
    filterGameTracks(unique)

  return shuffle(usable).slice(
    0,
    limit,
  )
}