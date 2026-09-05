import type { MusicTrack } from './musicProvider.js'
import { deezerMusicProvider } from './deezerMusicProvider.js'

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

function isUsableTrack(
  track: MusicTrack,
): boolean {
  return Boolean(
    track.title &&
      track.artist &&
      track.album &&
      track.previewUrl,
  )
}

function removeDuplicates(
  tracks: MusicTrack[],
): MusicTrack[] {
  const seen = new Set<string>()

  return tracks.filter((track) => {
    const key =
      `${track.title.toLowerCase()}-${track.artist.toLowerCase()}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)

    return true
  })
}

export async function discoverTracks(
  limit = 20,
): Promise<MusicTrack[]> {
  const queries =
    shuffle(DISCOVERY_QUERIES)

  const tracks: MusicTrack[] = []

  for (const query of queries) {
    const results =
      await deezerMusicProvider.searchTracks(
        query,
        10,
      )

    tracks.push(...results)

    if (
      removeDuplicates(
        tracks,
      ).length >= limit
    ) {
      break
    }
  }

  return removeDuplicates(
    tracks,
  )
    .filter(isUsableTrack)
    .slice(0, limit)
}