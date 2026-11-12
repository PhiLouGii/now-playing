
import type { Request, Response } from 'express'
import {
  getPixelCoverCatalogue,
  searchPixelCoverCatalogue,
} from '../services/pixelCoverService.js'

export async function getPixelCoverAlbums(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const albums = await getPixelCoverCatalogue()

    if (albums.length === 0) {
      res.status(503).json({
        error: 'The Pixel Cover catalogue is currently empty.',
        albums: [],
      })
      return
    }

    res.json({
      albums,
      total: albums.length,
    })
  } catch (error) {
    console.error('[Pixel Cover] Failed to load catalogue:', error)

    res.status(500).json({
      error: error instanceof Error
        ? error.message
        : 'Failed to load Pixel Cover albums.',
    })
  }
}

export async function searchPixelCoverAlbums(
  req: Request,
  res: Response,
): Promise<void> {
  const query =
    typeof req.query.q === 'string'
      ? req.query.q.trim()
      : ''

  if (!query) {
    res.json({ albums: [] })
    return
  }

  if (query.length > 100) {
    res.status(400).json({
      error: 'Search query is too long.',
    })
    return
  }

  try {
    const albums = await searchPixelCoverCatalogue(query)

    res.json({
      albums,
      total: albums.length,
    })
  } catch (error) {
    console.error('[Pixel Cover] Search failed:', error)

    res.status(500).json({
      error: error instanceof Error
        ? error.message
        : 'Failed to search Pixel Cover albums.',
    })
  }
}
