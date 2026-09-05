import type { Request, Response } from 'express'
import {
  getAllSongs,
  getSongById,
  searchSongs,
} from '../services/songService.js'

export async function getSongs(
  req: Request,
  res: Response,
) {
  try {
    const query = req.query.q

    if (
      typeof query === 'string' &&
      query.trim()
    ) {
      const songs =
        await searchSongs(query)

      res.json({
        songs,
      })

      return
    }

    const songs =
      await getAllSongs()

    res.json({
      songs,
    })
  } catch (error) {
    console.error(
      'Failed to get songs:',
      error,
    )

    res.status(500).json({
      error: 'Failed to get songs',
    })
  }
}

export async function getSong(
  req: Request,
  res: Response,
) {
  try {
    const { id } = req.params

    const song =
      await getSongById(id)

    if (!song) {
      res.status(404).json({
        error: 'Song not found',
      })

      return
    }

    res.json({
      song,
    })
  } catch (error) {
    console.error(
      'Failed to get song:',
      error,
    )

    res.status(500).json({
      error: 'Failed to get song',
    })
  }
}