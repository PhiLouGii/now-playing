import type { Request, Response } from 'express'
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'
import { discoverTracks } from '../services/music/musicDiscoveryService.js'


const FEATURED_ARTISTS = [
  'Rihanna',
  'Madonna',
  'Billie Eilish',
  'Lionel Richie',
  'The Killers',
  'Burna Boy',
  'Bruno Mars',
  'Elton John',
  'The Weeknd',
  'Beyoncé',
  'Taylor Swift',
  'Labrinth',
  'Arctic Monkeys',
  'One Direction',
  'Adele',
  'Michael Jackson',
  'Lady Gaga',
  'Drake',
  'SZA',
  'Ariana Grande',
  'Dua Lipa',
  'Coldplay',
  'Frank Ocean',
  'Doja Cat',
  'Tyler, The Creator',
  'Kendrick Lamar',
  'Nicki Minaj',
  'Miley Cyrus',
  'Justin Bieber',
  'Harry Styles',
  'The Beatles',
  'Queen',
  'ABBA',
  'Fleetwood Mac',
  'Amy Winehouse',
  'Tems',
  'Wizkid',
]



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
    const id = req.params.id

    if (typeof id !== 'string') {
      return res.status(400).json({
        error: 'Track ID is required',
      })
    }

    const track =
      await deezerMusicProvider.getTrackById(id)

    if (!track) {
      return res.status(404).json({
        error: 'Track not found',
      })
    }

    return res.json({ track })
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

export async function getFeaturedArtists(
  _req: Request,
  res: Response,
) {
  try {
    const results =
      await Promise.all(
        FEATURED_ARTISTS.map(
          async (artistName) => {
            const artists =
              await deezerMusicProvider.searchArtists(
                artistName,
                5,
              )

            const exactMatch =
              artists.find(
                (artist) =>
                  artist.name?.toLowerCase() ===
                  artistName.toLowerCase(),
              )

            const artist =
              exactMatch ?? artists[0]

            if (!artist) {
              return null
            }

            return {
              id: String(artist.id),
              name:
                artist.name ??
                artistName,
              image:
                artist.picture_medium ??
                artist.picture_big ??
                artist.picture ??
                null,
            }
          },
        ),
      )

    const artists =
      results.filter(
        (
          artist,
        ): artist is NonNullable<
          typeof artist
        > => artist !== null,
      )

    return res.json({
      artists,
    })
  } catch (error) {
    console.error(
      'Featured artist lookup failed:',
      error,
    )

    return res.status(500).json({
      error:
        'Failed to get featured artists',
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

    const decade =
      typeof req.query.decade === 'string'
        ? Number(req.query.decade)
        : undefined

    const validDecade =
      decade !== undefined &&
      [1960, 1970, 1980, 1990, 2000, 2010, 2020].includes(
        decade,
      )
        ? decade
        : undefined

    const tracks =
      await discoverTracks(
        Number.isFinite(limit)
          ? Math.min(Math.max(limit, 1), 50)
          : 20,
        validDecade,
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