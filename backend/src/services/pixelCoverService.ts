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

export const CURATED_ALBUMS: CuratedAlbum[] = [
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

const COLLECTION = 'pixelCoverAlbums'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
}

async function findCuratedAlbum(
  curated: CuratedAlbum,
): Promise<PixelCoverAlbum | null> {
  try {
    console.log(`[Pixel Cover] Searching: ${curated.title} — ${curated.artist}`)

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
      console.warn(`[Pixel Cover] No exact match: ${curated.title}`)
      return null
    }

    const coverUrl =
      match.cover_xl ??
      match.cover_big ??
      match.cover_medium ??
      match.cover ??
      ''

    if (!match.id || !coverUrl) return null

    return {
      id: String(match.id),
      title: curated.title,
      artist: curated.artist,
      year: curated.year,
      coverUrl,
    }
  } catch (error) {
    console.error(`[Pixel Cover] Search failed: ${curated.title}`, error)
    return null
  }
}

export async function seedCuratedPixelCoverAlbums() {
  console.log('[Pixel Cover] Starting curated album seeding...')

  let added = 0
  let skipped = 0

  for (const curated of CURATED_ALBUMS) {
    const album = await findCuratedAlbum(curated)

    if (!album) {
      skipped++
      continue
    }

    await db.collection(COLLECTION)
      .doc(album.id)
      .set({
        ...album,
        source: 'curated',
        updatedAt: new Date(),
      }, { merge: true })

    added++

    console.log(
      `[Pixel Cover] Saved ${album.title} (${added}/${CURATED_ALBUMS.length})`,
    )
  }

  console.log(
    `[Pixel Cover] Seeding complete. Saved: ${added}, skipped: ${skipped}`,
  )

  return { added, skipped }
}

export async function getPixelCoverCatalogue(): Promise<PixelCoverAlbum[]> {
  const snapshot = await db.collection(COLLECTION).get()

  return snapshot.docs.map(document => {
    const data = document.data()

    return {
      id: document.id,
      title: data.title,
      artist: data.artist,
      year: data.year ?? null,
      coverUrl: data.coverUrl,
    }
  }).filter(album => Boolean(
    album.title && album.artist && album.coverUrl,
  ))
}
