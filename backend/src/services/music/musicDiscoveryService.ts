import type { MusicTrack } from './musicProvider.js'
import { deezerMusicProvider } from './deezerMusicProvider.js'
import { filterGameTracks } from './musicTrackFilter.js'

import { artists1960s } from '../../data/eraArtists/1960s.js'
import { artists1970s } from '../../data/eraArtists/1970s.js'
import { artists1980s } from '../../data/eraArtists/1980s.js'
import { artists1990s } from '../../data/eraArtists/1990s.js'
import { artists2000s } from '../../data/eraArtists/2000s.js'
import { artists2010s } from '../../data/eraArtists/2010s.js'
import { artists2020s } from '../../data/eraArtists/2020s.js'

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

function getArtistsForDecade(
  decade: number,
): string[] {
  switch (decade) {
    case 1960:
      return artists1960s

    case 1970:
      return artists1970s

    case 1980:
      return artists1980s

    case 1990:
      return artists1990s

    case 2000:
      return artists2000s

    case 2010:
      return artists2010s

    case 2020:
      return artists2020s

    default:
      return []
  }
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

async function discoverFromArtists(
  artists: string[],
): Promise<MusicTrack[]> {
  const results =
    await Promise.all(
      artists.map(async (artist) => {
        try {
          return await deezerMusicProvider.searchTracks(
            artist,
            10,
          )
        } catch (error) {
          console.error(
            `Failed to search Deezer for artist ${artist}:`,
            error,
          )

          return []
        }
      }),
    )

  return results.flat()
}

async function discoverTracksForDecade(
  limit: number,
  decade: number,
): Promise<MusicTrack[]> {
  const artists =
    getArtistsForDecade(
      decade,
    )

  if (artists.length === 0) {
    return []
  }

  const selectedArtists =
    shuffle(artists)

  const discovered =
    await discoverFromArtists(
      selectedArtists,
    )

  const playable =
    filterGameTracks(
      deduplicateTracks(
        discovered,
      ),
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

  const limited =
    limitTracksPerArtist(
      decadeTracks,
      2,
    )

  return shuffle(
    limited,
  ).slice(
    0,
    limit,
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

export async function discoverTracks(
  limit = 20,
  decade?: number,
): Promise<MusicTrack[]> {
  if (
    decade !== undefined
  ) {
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