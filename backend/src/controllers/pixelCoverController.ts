
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
  { title: 'Thriller', artist: 'Michael Jackson', year: 1982 },
  { title: 'Bad', artist: 'Michael Jackson', year: 1987 },
  { title: 'Off the Wall', artist: 'Michael Jackson', year: 1979 },
  { title: 'Abbey Road', artist: 'The Beatles', year: 1969 },
  { title: 'Sgt. Pepper’s Lonely Hearts Club Band', artist: 'The Beatles', year: 1967 },
  { title: 'Nevermind', artist: 'Nirvana', year: 1991 },
  { title: 'The Dark Side of the Moon', artist: 'Pink Floyd', year: 1973 },
  { title: 'Rumours', artist: 'Fleetwood Mac', year: 1977 },
  { title: 'Purple Rain', artist: 'Prince', year: 1984 },
  { title: 'Born in the U.S.A.', artist: 'Bruce Springsteen', year: 1984 },
  { title: 'Back in Black', artist: 'AC/DC', year: 1980 },
  { title: 'Hotel California', artist: 'Eagles', year: 1976 },
  { title: 'The Joshua Tree', artist: 'U2', year: 1987 },
  { title: 'Like a Virgin', artist: 'Madonna', year: 1984 },
  { title: 'True Blue', artist: 'Madonna', year: 1986 },
  { title: 'Faith', artist: 'George Michael', year: 1987 },
  { title: 'Whitney Houston', artist: 'Whitney Houston', year: 1985 },
  { title: 'Dangerous', artist: 'Michael Jackson', year: 1991 },
  { title: 'The Bodyguard', artist: 'Whitney Houston', year: 1992 },
  { title: 'Jagged Little Pill', artist: 'Alanis Morissette', year: 1995 },
  { title: 'The Miseducation of Lauryn Hill', artist: 'Lauryn Hill', year: 1998 },
  { title: 'The Slim Shady LP', artist: 'Eminem', year: 1999 },
  { title: 'The Marshall Mathers LP', artist: 'Eminem', year: 2000 },
  { title: 'The College Dropout', artist: 'Kanye West', year: 2004 },
  { title: 'Graduation', artist: 'Kanye West', year: 2007 },
  { title: 'Good Girl Gone Bad', artist: 'Rihanna', year: 2007 },
  { title: 'Loud', artist: 'Rihanna', year: 2010 },
  { title: '21', artist: 'Adele', year: 2011 },
  { title: '25', artist: 'Adele', year: 2015 },
  { title: '1989', artist: 'Taylor Swift', year: 2014 },
  { title: 'Fearless', artist: 'Taylor Swift', year: 2008 },
  { title: 'Lemonade', artist: 'Beyoncé', year: 2016 },
  { title: 'Dangerously in Love', artist: 'Beyoncé', year: 2003 },
  { title: 'Future Nostalgia', artist: 'Dua Lipa', year: 2020 },
  { title: 'When We All Fall Asleep, Where Do We Go?', artist: 'Billie Eilish', year: 2019 },
  { title: 'SOUR', artist: 'Olivia Rodrigo', year: 2021 },
  { title: 'GUTS', artist: 'Olivia Rodrigo', year: 2023 },
  { title: 'After Hours', artist: 'The Weeknd', year: 2020 },
  { title: 'Starboy', artist: 'The Weeknd', year: 2016 },
  { title: 'SOS', artist: 'SZA', year: 2022 },
  { title: 'Ctrl', artist: 'SZA', year: 2017 },
  { title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar', year: 2015 },
  { title: 'good kid, m.A.A.d city', artist: 'Kendrick Lamar', year: 2012 },
  { title: 'DAMN.', artist: 'Kendrick Lamar', year: 2017 },
  { title: 'Scorpion', artist: 'Drake', year: 2018 },
  { title: 'Views', artist: 'Drake', year: 2016 },
  { title: 'Take Care', artist: 'Drake', year: 2011 },
  { title: 'ABBA Gold', artist: 'ABBA', year: 1992 },
  { title: 'Spice', artist: 'Spice Girls', year: 1996 },
  { title: 'Parachutes', artist: 'Coldplay', year: 2000 },
  { title: 'A Rush of Blood to the Head', artist: 'Coldplay', year: 2002 },
  { title: 'American Idiot', artist: 'Green Day', year: 2004 },
  { title: 'Hybrid Theory', artist: 'Linkin Park', year: 2000 },
  { title: 'The Fame', artist: 'Lady Gaga', year: 2008 },
  { title: 'Born This Way', artist: 'Lady Gaga', year: 2011 },
  { title: 'Teenage Dream', artist: 'Katy Perry', year: 2010 },
  { title: 'Back to Black', artist: 'Amy Winehouse', year: 2006 },
  { title: '1984', artist: 'Van Halen', year: 1984 },
  { title: 'A Night at the Opera', artist: 'Queen', year: 1975 },
  { title: 'News of the World', artist: 'Queen', year: 1977 },
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


    albumPoolCache.set(cacheKey, results)

    res.json({
      albums: results,
      requested: CURATED_ALBUMS.length,
      found: results.length,
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
