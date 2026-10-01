import { Router } from 'express'
import { db } from '../config/firebase.js'
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'
import {
  eraLibraries,
  type Era,
} from '../data/eras/index.js'

const router = Router()

function shuffle<T>(
  array: T[],
): T[] {
  const shuffled = [...array]

  for (
    let i = shuffled.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() * (i + 1),
      )

    ;[
      shuffled[i],
      shuffled[j],
    ] = [
      shuffled[j],
      shuffled[i],
    ]
  }

  return shuffled
}

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
          .where(
            'era',
            '==',
            era,
          )
          .get()

      if (snapshot.empty) {
        return res.status(404).json({
          message: `No songs found for the ${era}`,
        })
      }

      /*
       * ---------------------------------------------------------
       * FULL LIGHTWEIGHT METADATA POOL
       *
       * We keep every song here so the frontend can generate
       * distractors without needing Deezer data for every song.
       * ---------------------------------------------------------
       */

      const songs = snapshot.docs
        .map(document => {
          const data =
            document.data()

          if (
            !data.providerSongId
          ) {
            return null
          }

          return {
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
          }
        })
        .filter(
          (
            song,
          ): song is NonNullable<
            typeof song
          > => song !== null,
        )

      if (songs.length === 0) {
        return res.status(404).json({
          message:
            `No playable songs found for the ${era}`,
        })
      }

      /*
       * ---------------------------------------------------------
       * DETERMINE HOW MANY SONGS NEED DEEZER DATA
       * ---------------------------------------------------------
       *
       * The frontend normally asks for 10 questions.
       *
       * We fetch a few extra candidates so that if one or two
       * Deezer requests fail, we still have enough playable songs.
       */

      const requestedLimit =
        Number(
          req.query.limit,
        ) || 10

      const candidateCount =
        Math.min(
          Math.max(
            requestedLimit + 5,
            requestedLimit,
          ),
          songs.length,
        )

      /*
       * ---------------------------------------------------------
       * RANDOM PLAYABLE CANDIDATES
       * ---------------------------------------------------------
       */

      const selectedSongs =
        shuffle(songs).slice(
          0,
          candidateCount,
        )

      /*
       * ---------------------------------------------------------
       * FETCH DEEZER DATA IN PARALLEL
       * ---------------------------------------------------------
       */

      const playableResults =
        await Promise.all(
          selectedSongs.map(
            async song => {
              try {
                const track =
                  await deezerMusicProvider.getTrackById(
                    song.providerSongId,
                  )

                if (!track) {
                  return null
                }

                if (
                  !track.previewUrl
                ) {
                  return null
                }

                return {
                  ...song,
                  previewUrl:
                    track.previewUrl,
                  artworkUrl:
                    track.artworkUrl,
                }
              } catch (error) {
                console.error(
                  `Failed to load Deezer track ${song.providerSongId}:`,
                  error,
                )

                return null
              }
            },
          ),
        )

      const playableSongs =
        playableResults.filter(
          (
            song,
          ): song is NonNullable<
            typeof song
          > => song !== null,
        )

      if (
        playableSongs.length === 0
      ) {
        return res.status(404).json({
          message:
            `No playable Deezer songs found for the ${era}`,
        })
      }

      return res.json({
        era,
        count: songs.length,
        songs,
        playableSongs,
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