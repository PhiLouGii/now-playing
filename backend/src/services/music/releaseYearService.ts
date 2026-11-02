import type { MusicTrack } from './musicProvider.js'
import {
  musicBrainzProvider,
} from './musicBrainzProvider.js'

export async function getReliableReleaseYear(
  track: MusicTrack,
): Promise<number | undefined> {
  // Use Deezer's release year first when available.
  if (track.releaseYear !== undefined) {
    return track.releaseYear
  }

  if (!track.isrc) {
    return undefined
  }

  try {
    return await musicBrainzProvider.getFirstReleaseYear(
      track.isrc,
    )
  } catch {
    return undefined
  }
}
