import { db } from '../config/firebase.js'

export async function getAllSongs() {
  const snapshot = await db
    .collection('songs')
    .get()

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
}

export async function getSongById(
  id: string,
) {
  const doc = await db
    .collection('songs')
    .doc(id)
    .get()

  if (!doc.exists) {
    return null
  }

  return {
    id: doc.id,
    ...doc.data(),
  }
}

export async function searchSongs(
  query: string,
) {
  const snapshot = await db
    .collection('songs')
    .get()

  const normalizedQuery =
    query.trim().toLowerCase()

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((song) => {
      const title =
        typeof song.title === 'string'
          ? song.title.toLowerCase()
          : ''

      const artist =
        typeof song.artist === 'string'
          ? song.artist.toLowerCase()
          : ''

      const album =
        typeof song.album === 'string'
          ? song.album.toLowerCase()
          : ''

      return (
        title.includes(normalizedQuery) ||
        artist.includes(normalizedQuery) ||
        album.includes(normalizedQuery)
      )
    })
}