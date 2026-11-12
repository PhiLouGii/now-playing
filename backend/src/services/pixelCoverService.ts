
import { db } from '../config/firebase.js'
import { deezerMusicProvider } from './music/deezerMusicProvider.js'

export type PixelCoverAlbum = {
  id: string
  title: string
  artist: string
  year: number | null
  coverUrl: string
}

export type CuratedAlbum = {
  title: string
  artist: string
  year: number
}

const COLLECTION = 'pixelCoverAlbums'

const CURATED_ALBUMS: CuratedAlbum[] = [
  { title: 'Pet Sounds', artist: 'The Beach Boys', year: 1966 },
{ title: 'Revolver', artist: 'The Beatles', year: 1966 },
{ title: 'Are You Experienced', artist: 'The Jimi Hendrix Experience', year: 1967 },
{ title: 'Disraeli Gears', artist: 'Cream', year: 1967 },
{ title: 'The Velvet Underground & Nico', artist: 'The Velvet Underground', year: 1967 },
{ title: 'Odessey and Oracle', artist: 'The Zombies', year: 1968 },
{ title: 'Electric Ladyland', artist: 'The Jimi Hendrix Experience', year: 1968 },
{ title: 'At Folsom Prison', artist: 'Johnny Cash', year: 1968 },
{ title: 'Led Zeppelin II', artist: 'Led Zeppelin', year: 1969 },
{ title: 'Let It Bleed', artist: 'The Rolling Stones', year: 1969 },

{ title: 'Paranoid', artist: 'Black Sabbath', year: 1970 },
{ title: 'Bridge Over Troubled Water', artist: 'Simon & Garfunkel', year: 1970 },
{ title: 'Tea for the Tillerman', artist: 'Cat Stevens', year: 1970 },
{ title: 'Blue', artist: 'Joni Mitchell', year: 1971 },
{ title: 'What\'s Going On', artist: 'Marvin Gaye', year: 1971 },
{ title: 'Hunky Dory', artist: 'David Bowie', year: 1971 },
{ title: 'Harvest', artist: 'Neil Young', year: 1972 },
{ title: 'Talking Book', artist: 'Stevie Wonder', year: 1972 },
{ title: 'Innervisions', artist: 'Stevie Wonder', year: 1973 },
{ title: 'Goodbye Yellow Brick Road', artist: 'Elton John', year: 1973 },
{ title: 'Band on the Run', artist: 'Paul McCartney & Wings', year: 1973 },
{ title: 'The Rise and Fall of Ziggy Stardust and the Spiders from Mars', artist: 'David Bowie', year: 1972 },
{ title: 'Wish You Were Here', artist: 'Pink Floyd', year: 1975 },
{ title: 'A Night at the Opera', artist: 'Queen', year: 1975 },
{ title: 'Horses', artist: 'Patti Smith', year: 1975 },
{ title: 'Songs in the Key of Life', artist: 'Stevie Wonder', year: 1976 },
{ title: 'The Pretender', artist: 'Jackson Browne', year: 1976 },
{ title: 'Low', artist: 'David Bowie', year: 1977 },
{ title: 'Animals', artist: 'Pink Floyd', year: 1977 },
{ title: 'Parallel Lines', artist: 'Blondie', year: 1978 },
{ title: 'The Stranger', artist: 'Billy Joel', year: 1977 },
{ title: 'Breakfast in America', artist: 'Supertramp', year: 1979 },
{ title: 'London Calling', artist: 'The Clash', year: 1979 },
{ title: 'Unknown Pleasures', artist: 'Joy Division', year: 1979 },
{ title: 'Off the Wall', artist: 'Michael Jackson', year: 1979 },

{ title: 'Remain in Light', artist: 'Talking Heads', year: 1980 },
{ title: 'Back in Black', artist: 'AC/DC', year: 1980 },
{ title: 'Disintegration', artist: 'The Cure', year: 1989 },
{ title: 'Rio', artist: 'Duran Duran', year: 1982 },
{ title: 'Thriller', artist: 'Michael Jackson', year: 1982 },
{ title: 'The Number of the Beast', artist: 'Iron Maiden', year: 1982 },
{ title: 'Purple Rain', artist: 'Prince', year: 1984 },
{ title: 'Like a Virgin', artist: 'Madonna', year: 1984 },
{ title: 'Hounds of Love', artist: 'Kate Bush', year: 1985 },
{ title: 'The Queen Is Dead', artist: 'The Smiths', year: 1986 },
{ title: 'Control', artist: 'Janet Jackson', year: 1986 },
{ title: 'Graceland', artist: 'Paul Simon', year: 1986 },
{ title: 'Faith', artist: 'George Michael', year: 1987 },
{ title: 'Sign o\' the Times', artist: 'Prince', year: 1987 },
{ title: 'Appetite for Destruction', artist: 'Guns N\' Roses', year: 1987 },
{ title: 'Bad', artist: 'Michael Jackson', year: 1987 },
{ title: 'Straight Outta Compton', artist: 'N.W.A', year: 1988 },
{ title: 'The Stone Roses', artist: 'The Stone Roses', year: 1989 },
{ title: 'The Sensual World', artist: 'Kate Bush', year: 1989 },
{ title: 'Dare', artist: 'The Human League', year: 1981 },
{ title: 'The Game', artist: 'Queen', year: 1980 },
{ title: 'Closer', artist: 'Joy Division', year: 1980 },
{ title: 'Boy', artist: 'U2', year: 1980 },

{ title: 'Violator', artist: 'Depeche Mode', year: 1990 },
{ title: 'Nevermind', artist: 'Nirvana', year: 1991 },
{ title: 'Blood Sugar Sex Magik', artist: 'Red Hot Chili Peppers', year: 1991 },
{ title: 'Achtung Baby', artist: 'U2', year: 1991 },
{ title: 'Dirt', artist: 'Alice in Chains', year: 1992 },
{ title: 'Automatic for the People', artist: 'R.E.M.', year: 1992 },
{ title: 'The Chronic', artist: 'Dr. Dre', year: 1992 },
{ title: 'Enter the Wu-Tang (36 Chambers)', artist: 'Wu-Tang Clan', year: 1993 },
{ title: 'Siamese Dream', artist: 'The Smashing Pumpkins', year: 1993 },
{ title: 'Dookie', artist: 'Green Day', year: 1994 },
{ title: 'Illmatic', artist: 'Nas', year: 1994 },
{ title: 'Dummy', artist: 'Portishead', year: 1994 },
{ title: 'Definitely Maybe', artist: 'Oasis', year: 1994 },
{ title: 'The Bends', artist: 'Radiohead', year: 1995 },
{ title: 'Jagged Little Pill', artist: 'Alanis Morissette', year: 1995 },
{ title: 'Tragic Kingdom', artist: 'No Doubt', year: 1995 },
{ title: 'Mellon Collie and the Infinite Sadness', artist: 'The Smashing Pumpkins', year: 1995 },
{ title: 'Pinkerton', artist: 'Weezer', year: 1996 },
{ title: 'Spice', artist: 'Spice Girls', year: 1996 },
{ title: 'OK Computer', artist: 'Radiohead', year: 1997 },
{ title: 'Homogenic', artist: 'Björk', year: 1997 },
{ title: 'The Velvet Rope', artist: 'Janet Jackson', year: 1997 },
{ title: 'Urban Hymns', artist: 'The Verve', year: 1997 },
{ title: 'The Miseducation of Lauryn Hill', artist: 'Lauryn Hill', year: 1998 },
{ title: 'Ray of Light', artist: 'Madonna', year: 1998 },
{ title: 'Mezzanine', artist: 'Massive Attack', year: 1998 },
{ title: 'Aquemini', artist: 'OutKast', year: 1998 },
{ title: 'Play', artist: 'Moby', year: 1999 },
{ title: 'Californication', artist: 'Red Hot Chili Peppers', year: 1999 },
{ title: 'Black on Both Sides', artist: 'Mos Def', year: 1999 },
{ title: 'The Slim Shady LP', artist: 'Eminem', year: 1999 },

{ title: 'Parachutes', artist: 'Coldplay', year: 2000 },
{ title: 'Kid A', artist: 'Radiohead', year: 2000 },
{ title: 'The Marshall Mathers LP', artist: 'Eminem', year: 2000 },
{ title: 'Hybrid Theory', artist: 'Linkin Park', year: 2000 },
{ title: 'White Pony', artist: 'Deftones', year: 2000 },
{ title: 'Is This It', artist: 'The Strokes', year: 2001 },
{ title: 'Discovery', artist: 'Daft Punk', year: 2001 },
{ title: 'Songs About Jane', artist: 'Maroon 5', year: 2002 },
{ title: 'A Rush of Blood to the Head', artist: 'Coldplay', year: 2002 },
{ title: 'Come Away with Me', artist: 'Norah Jones', year: 2002 },
{ title: 'Elephant', artist: 'The White Stripes', year: 2003 },
{ title: 'Fallen', artist: 'Evanescence', year: 2003 },
{ title: 'Dangerously in Love', artist: 'Beyoncé', year: 2003 },
{ title: 'Speakerboxxx/The Love Below', artist: 'OutKast', year: 2003 },
{ title: 'The College Dropout', artist: 'Kanye West', year: 2004 },
{ title: 'American Idiot', artist: 'Green Day', year: 2004 },
{ title: 'Hot Fuss', artist: 'The Killers', year: 2004 },
{ title: 'Funeral', artist: 'Arcade Fire', year: 2004 },
{ title: 'Back to Black', artist: 'Amy Winehouse', year: 2006 },
{ title: 'Whatever People Say I Am, That\'s What I\'m Not', artist: 'Arctic Monkeys', year: 2006 },
{ title: 'The Black Parade', artist: 'My Chemical Romance', year: 2006 },
{ title: 'Good Girl Gone Bad', artist: 'Rihanna', year: 2007 },
{ title: 'Graduation', artist: 'Kanye West', year: 2007 },
{ title: 'In Rainbows', artist: 'Radiohead', year: 2007 },
{ title: 'Oracular Spectacular', artist: 'MGMT', year: 2007 },
{ title: 'Viva la Vida or Death and All His Friends', artist: 'Coldplay', year: 2008 },
{ title: 'The Fame', artist: 'Lady Gaga', year: 2008 },
{ title: 'Fearless', artist: 'Taylor Swift', year: 2008 },
{ title: 'For Emma, Forever Ago', artist: 'Bon Iver', year: 2007 },
{ title: 'Lungs', artist: 'Florence + The Machine', year: 2009 },
{ title: 'The Fame Monster', artist: 'Lady Gaga', year: 2009 },
{ title: 'Get Rich or Die Tryin’', artist: '50 Cent', year: 2003 },
{ title: 'The Open Door', artist: 'Evanescence', year: 2006 },
{ title: 'Neon Bible', artist: 'Arcade Fire', year: 2007 },
{ title: 'Pocketful of Sunshine', artist: 'Natasha Bedingfield', year: 2008 },
{ title: 'Rated R', artist: 'Rihanna', year: 2009 },

{ title: 'My Beautiful Dark Twisted Fantasy', artist: 'Kanye West', year: 2010 },
{ title: 'Teenage Dream', artist: 'Katy Perry', year: 2010 },
{ title: 'Loud', artist: 'Rihanna', year: 2010 },
{ title: '21', artist: 'Adele', year: 2011 },
{ title: 'Born This Way', artist: 'Lady Gaga', year: 2011 },
{ title: 'Take Care', artist: 'Drake', year: 2011 },
{ title: 'Ceremonials', artist: 'Florence + The Machine', year: 2011 },
{ title: 'Channel Orange', artist: 'Frank Ocean', year: 2012 },
{ title: 'good kid, m.A.A.d city', artist: 'Kendrick Lamar', year: 2012 },
{ title: 'AM', artist: 'Arctic Monkeys', year: 2013 },
{ title: 'Random Access Memories', artist: 'Daft Punk', year: 2013 },
{ title: 'Pure Heroine', artist: 'Lorde', year: 2013 },
{ title: 'Yeezus', artist: 'Kanye West', year: 2013 },
{ title: '1989', artist: 'Taylor Swift', year: 2014 },
{ title: 'In the Lonely Hour', artist: 'Sam Smith', year: 2014 },
{ title: 'To Pimp a Butterfly', artist: 'Kendrick Lamar', year: 2015 },
{ title: 'Emotion', artist: 'Carly Rae Jepsen', year: 2015 },
{ title: '25', artist: 'Adele', year: 2015 },
{ title: 'Anti', artist: 'Rihanna', year: 2016 },
{ title: 'Lemonade', artist: 'Beyoncé', year: 2016 },
{ title: 'Blonde', artist: 'Frank Ocean', year: 2016 },
{ title: 'Starboy', artist: 'The Weeknd', year: 2016 },
{ title: 'Melodrama', artist: 'Lorde', year: 2017 },
{ title: 'Ctrl', artist: 'SZA', year: 2017 },
{ title: 'DAMN.', artist: 'Kendrick Lamar', year: 2017 },
{ title: 'Flower Boy', artist: 'Tyler, The Creator', year: 2017 },
{ title: 'Golden Hour', artist: 'Kacey Musgraves', year: 2018 },
{ title: 'Sweetener', artist: 'Ariana Grande', year: 2018 },
{ title: 'When We All Fall Asleep, Where Do We Go?', artist: 'Billie Eilish', year: 2019 },
{ title: 'Norman Fucking Rockwell!', artist: 'Lana Del Rey', year: 2019 },
{ title: 'IGOR', artist: 'Tyler, The Creator', year: 2019 },
{ title: 'thank u, next', artist: 'Ariana Grande', year: 2019 },
{ title: 'Pink Friday', artist: 'Nicki Minaj', year: 2010 },
{ title: 'Born to Die', artist: 'Lana Del Rey', year: 2012 },
{ title: 'Halcyon', artist: 'Ellie Goulding', year: 2012 },
{ title: 'Unapologetic', artist: 'Rihanna', year: 2012 },
{ title: 'Yours Truly', artist: 'Ariana Grande', year: 2013 },
{ title: 'The Pinkprint', artist: 'Nicki Minaj', year: 2014 },
{ title: 'Beauty Behind the Madness', artist: 'The Weeknd', year: 2015 },
{ title: 'V', artist: 'Maroon 5', year: 2014 },
{ title: 'X', artist: 'Ed Sheeran', year: 2014 },
{ title: 'The Life of Pablo', artist: 'Kanye West', year: 2016 },
{ title: 'Hopeless Fountain Kingdom', artist: 'Halsey', year: 2017 },
{ title: 'reputation', artist: 'Taylor Swift', year: 2017 },
{ title: 'American Teen', artist: 'Khalid', year: 2017 },
{ title: 'Invasion of Privacy', artist: 'Cardi B', year: 2018 },
{ title: 'Trench', artist: 'Twenty One Pilots', year: 2018 },

{ title: 'Future Nostalgia', artist: 'Dua Lipa', year: 2020 },
{ title: 'After Hours', artist: 'The Weeknd', year: 2020 },
{ title: 'Punisher', artist: 'Phoebe Bridgers', year: 2020 },
{ title: 'folklore', artist: 'Taylor Swift', year: 2020 },
{ title: 'evermore', artist: 'Taylor Swift', year: 2020 },
{ title: 'SOUR', artist: 'Olivia Rodrigo', year: 2021 },
{ title: 'CALL ME IF YOU GET LOST', artist: 'Tyler, The Creator', year: 2021 },
{ title: 'Happier Than Ever', artist: 'Billie Eilish', year: 2021 },
{ title: 'Blue Weekend', artist: 'Wolf Alice', year: 2021 },
{ title: 'Dawn FM', artist: 'The Weeknd', year: 2022 },
{ title: 'Renaissance', artist: 'Beyoncé', year: 2022 },
{ title: 'SOS', artist: 'SZA', year: 2022 },
{ title: 'Midnights', artist: 'Taylor Swift', year: 2022 },
{ title: 'Harry\'s House', artist: 'Harry Styles', year: 2022 },
{ title: 'GUTS', artist: 'Olivia Rodrigo', year: 2023 },
{ title: 'The Record', artist: 'boygenius', year: 2023 },
{ title: 'Did You Know That There\'s a Tunnel Under Ocean Blvd', artist: 'Lana Del Rey', year: 2023 },
{ title: 'Desire, I Want to Turn Into You', artist: 'Caroline Polachek', year: 2023 },
{ title: 'Cowboy Carter', artist: 'Beyoncé', year: 2024 },
{ title: 'The Rise and Fall of a Midwest Princess', artist: 'Chappell Roan', year: 2023 },
{ title: 'BRAT', artist: 'Charli XCX', year: 2024 },
{ title: 'Hit Me Hard and Soft', artist: 'Billie Eilish', year: 2024 },
{ title: 'Short n\' Sweet', artist: 'Sabrina Carpenter', year: 2024 },
{ title: 'The Tortured Poets Department', artist: 'Taylor Swift', year: 2024 },
{ title: 'GNX', artist: 'Kendrick Lamar', year: 2024 },
{ title: 'DeBÍ TiRAR MáS FOToS', artist: 'Bad Bunny', year: 2025 },
{ title: 'Mayhem', artist: 'Lady Gaga', year: 2025 },
{ title: 'The Life of a Showgirl', artist: 'Taylor Swift', year: 2025 },
{ title: 'petal', artist: 'Ariana Grande', year: 2026 },
{ title: 'and all pride aside', artist: 'kwn', year: 2026 },
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
  'GloRilla',
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
  'Childish Gambino',
  'Pink Floyd',
  'Nirvana',
  'Michael Jackson',
]

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
}

function getCoverUrl(album: {
  cover?: string
  cover_medium?: string
  cover_big?: string
  cover_xl?: string
}): string {
  return (
    album.cover_xl ??
    album.cover_big ??
    album.cover_medium ??
    album.cover ??
    ''
  )
}

async function findCuratedAlbum(
  curated: CuratedAlbum,
): Promise<PixelCoverAlbum | null> {
  try {
    const results = await deezerMusicProvider.searchAlbums(
      curated.title,
      25,
    )

    const expectedArtist = normalize(curated.artist)
    const expectedTitle = normalize(curated.title)

    const match = results.find(album =>
      normalize(album.title) === expectedTitle &&
      normalize(album.artist?.name ?? '') === expectedArtist,
    )

    if (!match) {
      console.warn(
        `[Pixel Cover] No exact match: ${curated.title} — ${curated.artist}`,
      )
      return null
    }

    const coverUrl = getCoverUrl(match)

    if (!match.id || !coverUrl) return null

    return {
      id: String(match.id),
      title: curated.title,
      artist: curated.artist,
      year: curated.year,
      coverUrl,
    }
  } catch (error) {
    console.error(
      `[Pixel Cover] Curated lookup failed: ${curated.title}`,
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

    if (!artist) {
      console.warn(`[Pixel Cover] Artist not found: ${artistName}`)
      return []
    }

    const albums = await deezerMusicProvider.getArtistAlbums(
      String(artist.id),
      25,
    )

    return albums.flatMap(album => {
      const coverUrl = getCoverUrl(album)

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
    console.error(
      `[Pixel Cover] Artist lookup failed: ${artistName}`,
      error,
    )
    return []
  }
}

async function saveAlbums(
  albums: PixelCoverAlbum[],
  source: 'curated' | 'discovered',
  discoveredFrom?: string,
): Promise<number> {
  let saved = 0

  // Keep batches small and safely below Firestore's 500-write limit.
  for (let start = 0; start < albums.length; start += 400) {
    const chunk = albums.slice(start, start + 400)
    const batch = db.batch()

    for (const album of chunk) {
      const ref = db.collection(COLLECTION).doc(album.id)

      const data: Record<string, unknown> = {
        ...album,
        source,
        updatedAt: new Date(),
      }

      if (discoveredFrom) {
        data.discoveredFrom = discoveredFrom
      }

      batch.set(ref, data, { merge: true })
    }

    await batch.commit()
    saved += chunk.length
  }

  return saved
}

export async function seedCuratedPixelCoverAlbums() {
  console.log('[Pixel Cover] Starting curated album seeding...')

  let saved = 0
  let skipped = 0

  for (let index = 0; index < CURATED_ALBUMS.length; index++) {
    const curated = CURATED_ALBUMS[index]

    console.log(
      `[Pixel Cover] Curated ${index + 1}/${CURATED_ALBUMS.length}: ${curated.title}`,
    )

    const album = await findCuratedAlbum(curated)

    if (!album) {
      skipped++
      continue
    }

    await saveAlbums([album], 'curated')
    saved++
  }

  console.log(
    `[Pixel Cover] Curated seeding complete. Saved: ${saved}, skipped: ${skipped}`,
  )

  return { added: saved, skipped }
}

export async function discoverPixelCoverAlbums() {
  console.log('[Pixel Cover] Starting artist discovery...')

  let processed = 0
  let failed = 0

  // Avoid searching the same artist more than once in this run.
  const artists = [...new Set(DISCOVERY_ARTISTS)]

  for (let index = 0; index < artists.length; index++) {
    const artistName = artists[index]

    console.log(
      `[Pixel Cover] Artist ${index + 1}/${artists.length}: ${artistName}`,
    )

    try {
      const albums = await findArtistAlbums(artistName)

      if (albums.length === 0) {
        console.warn(`[Pixel Cover] No usable albums: ${artistName}`)
        continue
      }

      const uniqueAlbums = [
        ...new Map(albums.map(album => [album.id, album])).values(),
      ]

      const saved = await saveAlbums(
        uniqueAlbums,
        'discovered',
        artistName,
      )

      processed += saved

      console.log(
        `[Pixel Cover] Saved ${saved} albums from ${artistName}`,
      )
    } catch (error) {
      failed++

      console.error(
        `[Pixel Cover] Could not process ${artistName}:`,
        error,
      )
    }
  }

  console.log('[Pixel Cover] Artist discovery complete.')
  console.log(`[Pixel Cover] Albums processed: ${processed}`)
  console.log(`[Pixel Cover] Artists failed: ${failed}`)

  return { discovered: processed, failed }
}

export async function getPixelCoverCatalogue(): Promise<PixelCoverAlbum[]> {
  const snapshot = await db.collection(COLLECTION).get()

  return snapshot.docs
    .map(document => {
      const data = document.data()

      return {
        id: document.id,
        title: data.title,
        artist: data.artist,
        year: data.year ?? null,
        coverUrl: data.coverUrl,
      } satisfies PixelCoverAlbum
    })
    .filter(album =>
      Boolean(
        album.id &&
        album.title &&
        album.artist &&
        album.coverUrl,
      ),
    )
}

export async function searchPixelCoverCatalogue(
  query: string,
): Promise<PixelCoverAlbum[]> {
  const normalizedQuery = normalize(query)

  if (!normalizedQuery) return []

  const catalogue = await getPixelCoverCatalogue()

  return catalogue
    .filter(album =>
      normalize(album.title).includes(normalizedQuery) ||
      normalize(album.artist).includes(normalizedQuery),
    )
    .slice(0, 10)
}
