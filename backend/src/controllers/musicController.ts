import type { Request, Response } from 'express'

import {
  deezerMusicProvider,
} from '../services/music/deezerMusicProvider.js'

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

type FeaturedArtist = {
  id: string
  name: string
  image: string | null
}

const artistLookupCache =
  new Map<
    string,
    Promise<FeaturedArtist | null>
  >()

async function lookupArtist(
  artistName: string,
): Promise<FeaturedArtist | null> {
  const cached =
    artistLookupCache.get(
      artistName,
    )

  if (cached) {
    return cached
  }

  const lookupPromise =
    (async () => {
      try {
        const artists =
          await deezerMusicProvider.searchArtists(
            artistName,
            5,
          )

        if (
          artists.length === 0
        ) {
          console.warn(
            `No Deezer artist found for "${artistName}".`,
          )

          return null
        }

        const normalizedQuery =
          artistName
            .trim()
            .toLowerCase()

        const exactMatch =
          artists.find(
            (artist) =>
              artist.name
                .trim()
                .toLowerCase() ===
              normalizedQuery,
          )

        const artist =
          exactMatch ??
          artists[0]

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
      } catch (error) {
        console.error(
          `Featured artist lookup failed for "${artistName}":`,
          error,
        )

        return null
      }
    })()

  artistLookupCache.set(
    artistName,
    lookupPromise,
  )

  try {
    return await lookupPromise
  } catch (error) {
    artistLookupCache.delete(
      artistName,
    )

    throw error
  }
}

export async function getFeaturedArtists(
  _req: Request,
  res: Response,
): Promise<void> {
  const artists: FeaturedArtist[] = []

  /*
   * Deliberately sequential.
   *
   * The provider already has a global request queue,
   * but doing this sequentially also prevents this
   * endpoint from creating a large burst of queued work.
   */
  for (
    const artistName of FEATURED_ARTISTS
  ) {
    const artist =
      await lookupArtist(
        artistName,
      )

    if (artist) {
      artists.push(artist)
    }
  }

  res.json({
    artists,
  })
}

export async function searchMusic(
  req: Request,
  res: Response,
): Promise<void> {
  const query =
    typeof req.query.q === 'string'
      ? req.query.q.trim()
      : ''

  if (!query) {
    res.status(400).json({
      error:
        'Search query is required.',
    })

    return
  }

  try {
    const tracks =
      await deezerMusicProvider.searchTracks(
        query,
        25,
      )

    res.json({
      tracks,
    })
  } catch (error) {
    console.error(
      'Music search failed:',
      error,
    )

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'Music search failed.',
    })
  }
}

export async function discoverMusic(
  req: Request,
  res: Response,
): Promise<void> {
  const genre =
    typeof req.query.genre === 'string'
      ? req.query.genre.trim()
      : ''

  try {
    if (genre) {
      const artists =
        await deezerMusicProvider.getGenreArtists(
          genre,
          50,
        )

      res.json({
        artists,
      })

      return
    }

    const tracks =
      await deezerMusicProvider.getChartTracks(
        50,
      )

    res.json({
      tracks,
    })
  } catch (error) {
    console.error(
      'Music discovery failed:',
      error,
    )

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'Music discovery failed.',
    })
  }
}

export async function getMusicTrack(
  req: Request,
  res: Response,
): Promise<void> {
  const id =
    typeof req.params.id === 'string'
      ? req.params.id.trim()
      : ''

  if (!id) {
    res.status(400).json({
      error:
        'Track ID is required.',
    })

    return
  }

  try {
    const track =
      await deezerMusicProvider.getTrackById(
        id,
      )

    if (!track) {
      res.status(404).json({
        error:
          'Track not found.',
      })

      return
    }

    res.json(track)
  } catch (error) {
    console.error(
      'Track lookup failed:',
      error,
    )

    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'Track lookup failed.',
    })
  }
}