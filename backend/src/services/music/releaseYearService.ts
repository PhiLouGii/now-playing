import type { MusicTrack } from './musicProvider.js'
import {
  musicBrainzProvider,
} from './musicBrainzProvider.js'

export async function getReliableReleaseYear(
  track: MusicTrack,
): Promise<number | undefined> {
  if (track.isrc) {
    try {
      const musicBrainzYear =
        await musicBrainzProvider.getFirstReleaseYear(
          track.isrc,
        )

      if (
        musicBrainzYear !== undefined
      ) {
        return musicBrainzYear
      }
    } catch {
      // Fall through to Deezer's value.
    }
  }

  return track.releaseYear
}