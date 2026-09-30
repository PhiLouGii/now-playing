import { Router } from 'express'
import { db } from '../config/firebase.js'
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'
import {
  eraLibraries,
  type Era,
} from '../data/eras/index.js'

const router = Router()

router.get(
  '/:era',
  async (req, res) => {
    try {
      const era =
        req.params.era as Era

      if (
        !Object.prototype.hasOwnProperty.call(
          eraLibraries,
          era,
        )
      ) {
        return res.status(400).json({
          message: `Unsupported era: ${era}`,
        })
      }

      const snapshot =
        await db
          .collection('songs')
          .where('era', '==', era)
          .get()

      if (snapshot.empty) {
        return res.status(404).json({
          message: `No songs found for the ${era}`,
        })
      }

      const songs = []

      for (
        const document of snapshot.docs
      ) {
        const data =
          document.data()

        if (
          !data.providerSongId
        ) {
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
          provider: data.provider,
          providerSongId:
            data.providerSongId,
          previewUrl:
            track.previewUrl,
          artworkUrl:
            track.artworkUrl,
        })
      }

      return res.json({
        era,
        count: songs.length,
        songs,
      })
    } catch (error) {
      console.error(
        `Failed to load ${req.params.era}:`,
        error,
      )

      return res.status(500).json({
        message:
          `Failed to load ${req.params.era}`,
      })
    }
  },
)

export default router