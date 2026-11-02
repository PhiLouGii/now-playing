
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

      if (
  song.title === 'Running Up That Hill' ||
  song.title === 'Dreams'
) {
  console.log(
    '\nDEBUG SEARCH RESULTS:',
    results.map(track => ({
      id: track.id,
      providerId: track.providerId,
      title: track.title,
      artist: track.artist,
      album: track.album,
      preview: Boolean(track.previewUrl),
    })),
  )
}

      const matches = results.filter((track) => (
        normalize(track.title) === expectedTitle &&
        normalize(track.artist) === expectedArtist &&
        Boolean(track.previewUrl) &&
        Boolean(track.providerId)
      ))

      if (matches.length === 0) {
        console.log('  SKIPPED: No matching playable track.')
        skipped++
        continue
      }

      if (matches.length > 1) {
        console.warn(
          `  WARNING: Multiple matches found for "${song.title}".`,
        )
      }

      const match = matches[0]

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

      console.log(
        `  ADDED: ${song.title} (${song.year})`,
      )

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
