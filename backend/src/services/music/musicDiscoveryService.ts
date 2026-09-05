import type { MusicTrack } from './musicProvider.js'
import { deezerMusicProvider } from './deezerMusicProvider.js'
import { filterGameTracks } from './musicTrackFilter.js'

const DISCOVERY_QUERIES = [
  'Sabrina Carpenter',
  'The Weeknd',
  'Arctic Monkeys',
  'Tyla',
  'Dua Lipa',
  'Billie Eilish',
  'Taylor Swift',
  'Ariana Grande',
  'Olivia Rodrigo',
  'Bruno Mars',
]

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(
    () => Math.random() - 0.5,
  )
}

export async function discoverTracks(
  limit = 20,
): Promise<MusicTrack[]> {
  const queries =
    shuffle(DISCOVERY_QUERIES)

  const candidates: MusicTrack[] = []

  for (const query of queries) {
    const results =
      await deezerMusicProvider.searchTracks(
        query,
        10,
      )

    candidates.push(...results)

    const usable =
      filterGameTracks(
        candidates,
      )

    if (usable.length >= limit) {
      return usable.slice(
        0,
        limit,
      )
    }
  }

  return filterGameTracks(
    candidates,
  ).slice(0, limit)
}