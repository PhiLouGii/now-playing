import { Router } from 'express'
import { db } from '../config/firebase.js'
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'
import {
  genreLibraries,
  type Genre,
} from '../data/genres/index.js'

const router = Router()

router.get(
  '/:genre',
  async (req, res) => {
    try {
      const genre =
        req.params.genre as Genre

      if (
        !Object.prototype.hasOwnProperty.call(
          genreLibraries,
          genre,
        )
      ) {
        return res.status(400).json({
          message: `Unsupported genre: ${genre}`,
        })
      }

      const snapshot =
        await db
          .collection('songs')
          .where(
            'genres',
            'array-contains',
            genre,
          )
          .get()

      if (snapshot.empty) {
        return res.status(404).json({
          message: `No songs found for the genre ${genre}`,
        })
      }

      const songs = []

      for (
        const document of snapshot.docs
      ) {
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
          genres: data.genres ?? [],
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
        genre,
        count: songs.length,
        songs,
      })
    } catch (error) {
      console.error(
        `Failed to load ${req.params.genre}:`,
        error,
      )

      return res.status(500).json({
        message:
          `Failed to load ${req.params.genre}`,
      })
    }
  },
)

export default router