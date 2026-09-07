import { db } from '../config/firebase.js'

type FirestoreSong = {
  id: string
  title?: string
  artist?: string
  album?: string
  releaseYear?: number
  artworkUrl?: string
  audioUrl?: string
  genres?: string[]
}

function mapSong(
  doc: FirebaseFirestore.DocumentSnapshot,
): FirestoreSong {
  const data =
    doc.data() ?? {}

  return {
    id: doc.id,
    title:
      typeof data.title === 'string'
        ? data.title
        : undefined,
    artist:
      typeof data.artist === 'string'
        ? data.artist
        : undefined,
    album:
      typeof data.album === 'string'
        ? data.album
        : undefined,
    releaseYear:
      typeof data.releaseYear === 'number'
        ? data.releaseYear
        : undefined,
    artworkUrl:
      typeof data.artworkUrl === 'string'
        ? data.artworkUrl
        : undefined,
    audioUrl:
      typeof data.audioUrl === 'string'
        ? data.audioUrl
        : undefined,
    genres:
      Array.isArray(data.genres)
        ? data.genres.filter(
            (genre): genre is string =>
              typeof genre === 'string',
          )
        : undefined,
  }
}

export async function getAllSongs(): Promise<
  FirestoreSong[]
> {
  const snapshot = await db
    .collection('songs')
    .get()

  return snapshot.docs.map(mapSong)
}

export async function getSongById(
  id: string,
): Promise<FirestoreSong | null> {
  const doc = await db
    .collection('songs')
    .doc(id)
    .get()

  if (!doc.exists) {
    return null
  }

  return mapSong(doc)
}

export async function searchSongs(
  query: string,
): Promise<FirestoreSong[]> {
  const snapshot = await db
    .collection('songs')
    .get()

  const normalizedQuery =
    query.trim().toLowerCase()

  return snapshot.docs
    .map(mapSong)
    .filter((song) => {
      const title =
        song.title?.toLowerCase() ?? ''

      const artist =
        song.artist?.toLowerCase() ?? ''

      const album =
        song.album?.toLowerCase() ?? ''

      return (
        title.includes(normalizedQuery) ||
        artist.includes(normalizedQuery) ||
        album.includes(normalizedQuery)
      )
    })
}