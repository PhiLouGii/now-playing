import type { MusicTrack } from './musicProvider.js'

const EXCLUDED_PATTERNS = [
  'remix',
  'live',
  'acoustic',
  'instrumental',
  'karaoke',
  'extended',
  'radio edit',
  'radio version',
  'sped up',
  'slowed',
  'slowed + reverb',
  'nightcore',
  'edit',
  'version',
  'cover',
  'tribute',
  'demo',
]

function normalizeText(
  value: string,
): string {
  return value
    .toLowerCase()
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function containsExcludedPattern(
  value: string,
): boolean {
  const normalized =
    normalizeText(value)

  return EXCLUDED_PATTERNS.some(
    (pattern) =>
      normalized.includes(pattern),
  )
}

export function isGamePlayableTrack(
  track: MusicTrack,
): boolean {
  if (!track.title) {
    return false
  }

  if (!track.artist) {
    return false
  }

  if (!track.album) {
    return false
  }

  if (!track.previewUrl) {
    return false
  }

  if (
    containsExcludedPattern(
      track.title,
    )
  ) {
    return false
  }

  return true
}

export function filterGameTracks(
  tracks: MusicTrack[],
): MusicTrack[] {
  const seen = new Set<string>()

  return tracks.filter((track) => {
    if (
      !isGamePlayableTrack(track)
    ) {
      return false
    }

    const key =
      `${normalizeText(track.title)}::${normalizeText(track.artist)}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)

    return true
  })
}