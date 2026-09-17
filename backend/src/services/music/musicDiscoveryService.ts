import type { MusicTrack } from './musicProvider.js'

import { deezerMusicProvider } from './deezerMusicProvider.js'
import { filterGameTracks } from './musicTrackFilter.js'

import { DISCOVERY_ARTISTS } from '../../data/discoveryArtists.js'

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

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function deduplicateTracks(
  tracks: MusicTrack[],
): MusicTrack[] {
  const seen = new Set<string>()

  return tracks.filter((track) => {
    const key =
      `${normalize(track.title)}::${normalize(track.artist)}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function limitTracksPerArtist(
  tracks: MusicTrack[],
  maxPerArtist: number,
): MusicTrack[] {
  const counts = new Map<string, number>()

  return tracks.filter((track) => {
    const artist = normalize(track.artist)
    const count = counts.get(artist) ?? 0

    if (count >= maxPerArtist) {
      return false
    }

    counts.set(artist, count + 1)
    return true
  })
}

function filterByDecade(
  tracks: MusicTrack[],
  decade: number,
): MusicTrack[] {
  const end = decade + 10

  return tracks.filter(
    (track) =>
      track.releaseYear !== undefined &&
      track.releaseYear >= decade &&
      track.releaseYear < end,
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
      if (track.releaseYear !== undefined) {
        return track
      }

      try {
        const detailed =
          await deezerMusicProvider.getTrackById(
            track.id,
          )

        return detailed ?? track
      } catch {
        return track
      }
    }),
  )
}

async function discoverFromArtists(
  artists: string[],
  tracksPerArtist = 20,
): Promise<MusicTrack[]> {
  const results =
    await Promise.all(
      artists.map(async (artist) => {
        try {
          const tracks =
            await deezerMusicProvider.searchTracks(
              artist,
              tracksPerArtist,
            )

          console.log(
            `Artist: ${artist} | Deezer returned: ${tracks.length}`,
          )

          console.log(
            tracks.slice(0, 3).map((track) => ({
              title: track.title,
              artist: track.artist,
              releaseYear: track.releaseYear,
            })),
          )

          return tracks
        } catch (error) {
          console.error(
            `Failed to discover tracks for ${artist}:`,
            error,
          )

          return []
        }
      }),
    )

  const flattened = results.flat()

  return deduplicateTracks(
    filterGameTracks(flattened),
  )
}

async function discoverFromBasicArtists(
  limit: number,
): Promise<MusicTrack[]> {
  const artists = shuffle(
    DISCOVERY_ARTISTS,
  )

  const candidates: MusicTrack[] = []

  const batchSize = 15

  for (
    let index = 0;
    index < artists.length;
    index += batchSize
  ) {
    const batch = artists.slice(
      index,
      index + batchSize,
    )

    const discovered =
      await discoverFromArtists(
        batch,
        20,
      )

    candidates.push(...discovered)

    const usable =
      limitTracksPerArtist(
        deduplicateTracks(
          filterGameTracks(candidates),
        ),
        2,
      )

    if (usable.length >= limit) {
      return shuffle(usable).slice(
        0,
        limit,
      )
    }
  }

  return shuffle(
    limitTracksPerArtist(
      deduplicateTracks(
        filterGameTracks(candidates),
      ),
      2,
    ),
  ).slice(0, limit)
}

async function discoverTracksForDecade(
  limit: number,
  decade: number,
): Promise<MusicTrack[]> {
  const artists =
    getArtistsForDecade(decade)

  const selectedArtists =
    shuffle(artists).slice(
      0,
      Math.min(20, artists.length),
    )

  const tracks =
    await discoverFromArtists(
      selectedArtists,
      20,
    )

  const enriched =
    await enrichReleaseYears(tracks)

  const decadeTracks =
    filterByDecade(
      enriched,
      decade,
    )

  return shuffle(
    limitTracksPerArtist(
      deduplicateTracks(decadeTracks),
      2,
    ),
  ).slice(0, limit)
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

  return discoverFromBasicArtists(limit)
}