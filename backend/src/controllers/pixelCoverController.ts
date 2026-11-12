
import type { Request, Response } from 'express'
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'

type PixelCoverAlbum = {
  id: string
  title: string
  artist: string
  year: number | null
  coverUrl: string
}

type CuratedAlbum = {
  title: string
  artist: string
  year: number
}

// Starter collection. The year is the original release year.
// Deezer is used to retrieve the album ID and actual cover art.
const CURATED_ALBUMS: CuratedAlbum[] = [
  
]


const DISCOVERY_ARTISTS = [
  'Ariana Grande',
  'BTS',
  'Taylor Swift',
  'Beyoncé',
  'Rihanna',
  'Drake',
  'Kendrick Lamar',
  'The Weeknd',
  'Sabrina Carpenter',
  'Chappell Roan',
  'Lana Del Rey',
  'Lionel Richie',
  'Cardi B',
  'Migos',
  'Zayn',
  'Young Thug',
  'Chris Brown',
  'Glorilla',
  'Tyla',
  'Lorde',
  'Harry Styles',
  'One Direction',
  'Bruno Mars',
  'Doja Cat',
  'Tyler, The Creator',
  'Frank Ocean',
  'Travis Scott',
  'J. Cole',
  'SZA',
  'Billie Eilish',
  'Adele',
  'Lady Gaga',
  'Katy Perry',
  'Justin Bieber',
  'Demi Lovato',
  'Florence + The Machine',
  'Selena Gomez',
  'Miley Cyrus',
  'Paramore',
  'Arctic Monkeys',
  'Radiohead',
  'The Strokes',
  'Oasis',
  'The Cure',
  'David Bowie',
  'ABBA',
  'Queen',
  'Metallica',
  'Linkin Park',
  'Eminem',
  'Jay-Z',
  'Nas',
  'Bob Marley',
  'Burning Spear',
  'Fela Kuti',
  'Olivia Rodrigo',
  'Dua Lipa',
  'Halsey',
  'Melanie Martinez',
  'AC/DC',
  'The Beatles',
  'Charli XCX',
  'Kanye West',
  'Post Malone',
  'Mac Miller',
  'Frank Ocean',
  'Chilidish Gambino',
  'Pink Floyd',
  'Nirvana',
  'Michael Jackson',
]


const albumPoolCache = new Map<string, PixelCoverAlbum[]>()

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
}

function toPixelCoverAlbum(
  album: {
    id: number
    title: string
    release_date?: string
    cover?: string
    cover_medium?: string
    cover_big?: string
    cover_xl?: string
    artist?: { name: string }
  },
  curated: CuratedAlbum,
): PixelCoverAlbum | null {
  const coverUrl =
    album.cover_xl ??
    album.cover_big ??
    album.cover_medium ??
    album.cover ??
    ''

  if (!album.id || !album.title?.trim() || !coverUrl) {
    return null
  }

  return {
    id: String(album.id),
    title: curated.title,
    artist: curated.artist,
    year: curated.year,
    coverUrl,
  }
}

async function findCuratedAlbum(
  curated: CuratedAlbum,
): Promise<PixelCoverAlbum | null> {
  try {
    const results = await deezerMusicProvider.searchAlbums(
      curated.title,
      150,
    )

    const expectedArtist = normalize(curated.artist)
    const expectedTitle = normalize(curated.title)

    // Prefer the exact title AND artist to avoid remixes,
    // tribute albums, and unrelated albums with similar names.
    const exactMatch = results.find(album =>
      normalize(album.title) === expectedTitle &&
      normalize(album.artist?.name ?? '') === expectedArtist,
    )

    if (exactMatch) {
      return toPixelCoverAlbum(exactMatch, curated)
    }

    // If Deezer's search title differs slightly, only accept
    // an exact artist match and a close title match.
    const artistMatch = results.find(album =>
      normalize(album.artist?.name ?? '') === expectedArtist &&
      (
        normalize(album.title).includes(expectedTitle) ||
        expectedTitle.includes(normalize(album.title))
      ),
    )

    return artistMatch
      ? toPixelCoverAlbum(artistMatch, curated)
      : null
  } catch (error) {
    console.warn(
      `Could not find "${curated.title}" by ${curated.artist}:`,
      error,
    )
    return null
  }
}


async function findArtistAlbums(
  artistName: string,
): Promise<PixelCoverAlbum[]> {
  try {
    const artists = await deezerMusicProvider.searchArtists(
      artistName,
      5,
    )

    const expectedArtist = normalize(artistName)

    const artist = artists.find(
      item => normalize(item.name) === expectedArtist,
    )

    if (!artist) return []

    const albums = await deezerMusicProvider.getArtistAlbums(
      String(artist.id),
      25,
    )

    return albums.flatMap(album => {
      const coverUrl =
        album.cover_xl ??
        album.cover_big ??
        album.cover_medium ??
        album.cover ??
        ''

      if (!album.id || !album.title?.trim() || !coverUrl) {
        return []
      }

      const parsedYear = album.release_date
        ? Number(album.release_date.slice(0, 4))
        : NaN

      return [{
        id: String(album.id),
        title: album.title,
        artist: album.artist?.name ?? artist.name,
        year: Number.isFinite(parsedYear) ? parsedYear : null,
        coverUrl,
      }]
    })
  } catch (error) {
    console.warn(
      `Could not discover albums by ${artistName}:`,
      error,
    )

    return []
  }
}


export async function getPixelCoverAlbums(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const cacheKey = 'curated-albums'
    const cachedAlbums = albumPoolCache.get(cacheKey)

    if (cachedAlbums) {
      res.json({ albums: cachedAlbums })
      return
    }

    const results: PixelCoverAlbum[] = []
    const seen = new Set<string>()

    // Keep lookups sequential to respect the provider's
    // request queue and avoid overwhelming Deezer.
    for (const curated of CURATED_ALBUMS) {
      const album = await findCuratedAlbum(curated)

      if (album && !seen.has(album.id)) {
        seen.add(album.id)
        results.push(album)
      }
    }

    
    // Discover additional albums from a broader set of artists.
    for (const artistName of DISCOVERY_ARTISTS) {
      const discoveredAlbums = await findArtistAlbums(artistName)

      for (const album of discoveredAlbums) {
        if (!seen.has(album.id)) {
          seen.add(album.id)
          results.push(album)
        }
      }
    }


    // Cache and return the curated albums immediately.
albumPoolCache.set(cacheKey, results)

res.json({
  albums: results,
  requested: CURATED_ALBUMS.length,
  found: results.length,
})

// Discover more albums in the background so the game
// doesn't have to wait for every artist before loading.
void (async () => {
  for (const artistName of DISCOVERY_ARTISTS) {
    const discoveredAlbums = await findArtistAlbums(artistName)

    for (const album of discoveredAlbums) {
      if (!seen.has(album.id)) {
        seen.add(album.id)
        results.push(album)
      }
    }
  }

  console.log(
    `Pixel Cover discovery complete: ${results.length} albums loaded.`,
  )
})().catch(error => {
  console.error('Pixel Cover artist discovery failed:', error)
})
  } catch (error) {
    console.error('Pixel Cover album pool failed:', error)
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
    const normalizedQuery = normalize(query)

    // Suggestions come from the curated game pool, so a
    // player cannot be offered albums that aren't in the game.
    let pool = albumPoolCache.get('curated-albums')

    if (!pool) {
      const results: PixelCoverAlbum[] = []

      for (const curated of CURATED_ALBUMS) {
        const album = await findCuratedAlbum(curated)
        if (album) results.push(album)
      }

      pool = results
      albumPoolCache.set('curated-albums', pool)
    }

    
    const albums = pool
      .filter(album =>
        normalize(album.title).includes(normalizedQuery) ||
        normalize(album.artist).includes(normalizedQuery),
      )
      .slice(0, 10)

    res.json({ albums })

  } catch (error) {
    console.error('Pixel Cover album search failed:', error)
    res.status(500).json({
      error: error instanceof Error
        ? error.message
        : 'Failed to search Pixel Cover albums.',
    })
  }
}
