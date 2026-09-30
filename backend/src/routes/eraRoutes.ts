import { Router } from 'express'

import { db } from '../config/firebase.js'

import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'


const router = Router()


router.get(
  '/1960s',
  async (_req, res) => {
    try {
      const snapshot =
        await db
          .collection('songs')
          .where('era', '==', '1960s')
          .get()

      if (snapshot.empty) {
        return res.status(404).json({
          message:
            'No songs found for the 1960s',
        })
      }

      const songs = []

      for (const document of snapshot.docs) {
        const data =
          document.data()

        if (!data.providerSongId) {
          continue
        }

        const track =
          await deezerMusicProvider.getTrackById(
            data.providerSongId,
          )

        if (!track) {
          continue
        }

        songs.push({
          id: document.id,
          title: data.title,
          artist: data.artist,
          album: data.album,
          year: data.year,
          era: data.era,

          provider:
            data.provider,

          providerSongId:
            data.providerSongId,

          previewUrl:
            track.previewUrl,

          artworkUrl:
            track.artworkUrl,
        })
      }

      return res.json({
        era: '1960s',
        count: songs.length,
        songs,
      })
    } catch (error) {
      console.error(
        'Failed to load 1960s songs:',
        error,
      )

      return res.status(500).json({
        message:
          'Failed to load 1960s songs',
      })
    }
  },
)


export default router