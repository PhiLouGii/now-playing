import type { Request, Response } from 'express'
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'
import { discoverTracks } from '../services/music/musicDiscoveryService.js'

export async function searchMusic(
  req: Request,
  res: Response,
) {
  try {
    const query =
      typeof req.query.q === 'string'
        ? req.query.q.trim()
        : ''

    if (!query) {
      return res.status(400).json({
        error: 'Search query is required',
      })
    }

    const limit =
      typeof req.query.limit === 'string'
        ? Number(req.query.limit)
        : 10

    const tracks =
      await deezerMusicProvider.searchTracks(
        query,
        Number.isFinite(limit)
          ? Math.min(Math.max(limit, 1), 50)
          : 10,
      )

    return res.json({
      tracks,
    })
  } catch (error) {
    console.error(
      'Music search failed:',
      error,
    )

    return res.status(500).json({
      error: 'Failed to search music',
    })
  }
}

export async function getMusicTrack(
  req: Request,
  res: Response,
) {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({
        error: 'Track ID is required',
      })
    }

    const track =
      await deezerMusicProvider.getTrackById(
        id,
      )

    if (!track) {
      return res.status(404).json({
        error: 'Track not found',
      })
    }

    return res.json({
      track,
    })
  } catch (error) {
    console.error(
      'Music track lookup failed:',
      error,
    )

    return res.status(500).json({
      error: 'Failed to get music track',
    })
  }
}

export async function discoverMusic(
  req: Request,
  res: Response,
) {
  try {
    const limit =
      typeof req.query.limit === 'string'
        ? Number(req.query.limit)
        : 20

    const tracks =
      await discoverTracks(
        Number.isFinite(limit)
          ? Math.min(Math.max(limit, 1), 50)
          : 20,
      )

    return res.json({
      tracks,
    })
  } catch (error) {
    console.error(
      'Music discovery failed:',
      error,
    )

    return res.status(500).json({
      error: 'Failed to discover music',
    })
  }
}