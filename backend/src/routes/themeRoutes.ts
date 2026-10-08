import { Router } from 'express'

import { db } from '../config/firebase.js'
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'
import {
  themeLibraries,
  type Theme,
} from '../data/themes/index.js'

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
        Math.random() *
          (i + 1),
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
  '/:theme',
  async (req, res) => {
    try {
      const theme =
        req.params.theme as Theme

      if (
        !Object.prototype.hasOwnProperty.call(
          themeLibraries,
          theme,
        )
      ) {
        return res.status(400).json({
          message:
            `Unsupported theme: ${theme}`,
        })
      }

      const snapshot =
        await db
          .collection('songs')
          .where(
            'themes',
            'array-contains',
            theme,
          )
          .get()

      if (snapshot.empty) {
        return res.status(404).json({
          message:
            `No songs found for the ${theme} theme`,
        })
      }

      /*
       * ---------------------------------------------------------
       * FULL LIGHTWEIGHT METADATA POOL
       *
       * Keep every themed song so the frontend can use the
       * complete pool for distractors.
       * ---------------------------------------------------------
       */

      const songs =
        snapshot.docs
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
              genres:
                data.genres ?? [],
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
            `No playable songs found for the ${theme} theme`,
        })
      }

      /*
       * ---------------------------------------------------------
       * DETERMINE HOW MANY SONGS NEED DEEZER DATA
       * ---------------------------------------------------------
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
            `No playable Deezer songs found for the ${theme} theme`,
        })
      }

      return res.json({
        theme,
        count: songs.length,
        songs,
        playableSongs,
      })
    } catch (error) {
      console.error(
        `Failed to load theme ${req.params.theme}:`,
        error,
      )

      return res.status(500).json({
        message:
          `Failed to load ${req.params.theme} theme`,
      })
    }
  },
)

export default router