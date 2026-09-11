import type { MusicTrack } from './musicProvider.js'
import { deezerMusicProvider } from './deezerMusicProvider.js'
import { filterGameTracks } from './musicTrackFilter.js'

const DISCOVERY_ARTISTS = [
  'Arctic Monkeys',
]

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(
    () => Math.random() - 0.5,
  )
}

function isArtistMatch(
  track: MusicTrack,
  artist: string,
): boolean {
  return (
    normalize(track.artist) ===
    normalize(artist)
  )
}

export async function discoverTracks(
  limit = 20,
): Promise<MusicTrack[]> {
  const artists =
    shuffle(DISCOVERY_ARTISTS)

  const candidates: MusicTrack[] = []

  for (const artist of artists) {
    const results =
  await deezerMusicProvider.searchTracks(
    artist,
    50,
  )

    const artistTracks =
      results.filter((track) =>
        isArtistMatch(track, artist),
      )

    candidates.push(...artistTracks)

    const usable =
      filterGameTracks(candidates)

    if (usable.length >= limit) {
      return shuffle(usable).slice(
        0,
        limit,
      )
    }
  }

  return shuffle(
  filterGameTracks(candidates),
).slice(0, limit)
}