
import { db } from '../config/firebase.js'
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'
import { guessTheYearSongs } from '../data/guessTheYearSongs.js'

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()[\]{}]/g, ' ')
    .replace(/[:'"’“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Verified Deezer recording IDs for songs with multiple search results.
const preferredTrackIds: Record<string, string> = {
  'Running Up That Hill': '2173954687',
  Dreams: '63480987',
}

async function seedGuessTheYear() {
  console.log('\nSeeding Guess the Year...')
  console.log(`Songs in source list: ${guessTheYearSongs.length}\n`)

  let added = 0
  let skipped = 0

  for (const song of guessTheYearSongs) {
    try {
      console.log(`Searching: ${song.title} — ${song.artist}`)

      const results = await deezerMusicProvider.searchTracks(
        `${song.title} ${song.artist}`,
        10,
      )

      const expectedTitle = normalize(song.title)
      const expectedArtist = normalize(song.artist)

      const matches = results.filter((track) => {
        const actualTitle = normalize(track.title)
        const actualArtist = normalize(track.artist)

        const titleMatches =
          actualTitle === expectedTitle ||
          actualTitle.startsWith(`${expectedTitle} `)

        const artistMatches = actualArtist === expectedArtist

        return (
          titleMatches &&
          artistMatches &&
          Boolean(track.previewUrl) &&
          Boolean(track.providerId)
        )
      })

      if (matches.length === 0) {
        console.log('  SKIPPED: No matching playable track.')
        skipped++
        continue
      }

      const preferredId = preferredTrackIds[song.title]

      let match = undefined

      if (preferredId) {
        match = matches.find(
          (track) => track.providerId === preferredId,
        )

        if (!match) {
          console.log(
            '  SKIPPED: Preferred recording was not found.',
          )
          skipped++
          continue
        }
      } else if (matches.length === 1) {
        match = matches[0]
      } else {
        console.warn(
          `  SKIPPED: ${matches.length} possible recordings found. Verify before seeding:`,
        )

        matches.forEach((track) => {
          console.log(
            `    ${track.providerId} | ${track.title} | ${track.album}`,
          )
        })

        skipped++
        continue
      }

      const documentId =
        `guess_the_year_${song.title}_${song.artist}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')

      await db
        .collection('songs')
        .doc(documentId)
        .set({
          title: song.title,
          artist: song.artist,
          album: match.album,
          year: song.year,
          era: `${Math.floor(song.year / 10) * 10}s`,
          provider: 'deezer',
          providerSongId: match.providerId,
          gameModes: ['guess-the-year'],
          createdAt: new Date(),
        })

      console.log(`  ADDED: ${song.title} (${song.year})`)
      added++
    } catch (error) {
      console.error(`  ERROR: ${song.title}`, error)
      skipped++
    }
  }

  console.log('\n==============================')
  console.log(`Added: ${added}`)
  console.log(`Skipped: ${skipped}`)
  console.log('==============================\n')
}

seedGuessTheYear()
  .then(() => {
    console.log('Guess the Year seeding complete.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exit(1)
  })
