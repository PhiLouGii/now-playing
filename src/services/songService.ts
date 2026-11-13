
import type { Song } from '../types/game'
import { API_URL } from '../config/api'

type MusicTrackResponse = {
  track: Song
}

type MusicSearchResponse = {
  tracks: Song[]
}

export async function searchSongs(
  query: string,
  limit = 10,
): Promise<Song[]> {
  const normalizedQuery =
    query.trim()

  if (!normalizedQuery) {
    return []
  }

  const response =
    await fetch(
      `${API_URL}/music/search?q=${encodeURIComponent(
        normalizedQuery,
      )}&limit=${limit}`,
    )

  if (!response.ok) {
    throw new Error(
      'Failed to search music',
    )
  }

  const data =
    (await response.json()) as MusicSearchResponse

  return data.tracks
}

export async function discoverSongs(
  limit = 20,
  decade?: number,
): Promise<Song[]> {
  const params = new URLSearchParams()

  params.set('limit', String(limit))

  if (decade !== undefined) {
    params.set('decade', String(decade))
  }

  const response =
    await fetch(
      `${API_URL}/music/discover?${params.toString()}`,
    )

  if (!response.ok) {
    throw new Error(
      'Failed to discover music',
    )
  }

  const data =
    (await response.json()) as MusicSearchResponse

  return data.tracks
}

export async function getSongById(
  id: string,
): Promise<Song | undefined> {
  const response =
    await fetch(
      `${API_URL}/music/${encodeURIComponent(
        id,
      )}`,
    )

  if (response.status === 404) {
    return undefined
  }

  if (!response.ok) {
    throw new Error(
      'Failed to fetch music track',
    )
  }

  const data =
    (await response.json()) as MusicTrackResponse

  return data.track
}
