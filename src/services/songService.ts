import { songs } from '../data/songs'
import type { Song } from '../types/game'

export async function getSongs(): Promise<Song[]> {
  return songs
}

export async function getSongById(
  id: string,
): Promise<Song | undefined> {
  return songs.find(
    (song) => song.id === id,
  )
}

export async function searchSongs(
  query: string,
): Promise<Song[]> {
  const normalizedQuery =
    query.trim().toLowerCase()

  if (!normalizedQuery) {
    return songs
  }

  return songs.filter((song) => {
    return (
      song.title
        .toLowerCase()
        .includes(normalizedQuery) ||
      song.artist
        .toLowerCase()
        .includes(normalizedQuery) ||
      song.album
        .toLowerCase()
        .includes(normalizedQuery)
    )
  })
}