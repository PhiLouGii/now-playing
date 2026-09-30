import { db } from '../config/firebase.js'
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'
import {
  eraLibraries,
  type Era,
} from '../data/eras/index.js'

type SeedSong = {
  title: string
  artist: string
  year: number
}

const era = process.argv[2] as Era

if (!era || !(era in eraLibraries)) {
  console.error(
    'Please provide a valid era:',
  )

  console.error(
    Object.keys(eraLibraries).join(', '),
  )

  process.exit(1)
}

const songs =
  eraLibraries[era] as readonly SeedSong[]

async function seedEra() {
  console.log(
    `\nSeeding ${era}...`,
  )

  console.log(
    `Songs in source list: ${songs.length}\n`,
  )

  let added = 0
  let skipped = 0

  for (const song of songs) {
    try {
      console.log(
        `Searching: ${song.title} — ${song.artist}`,
      )

      const results =
        await deezerMusicProvider.searchTracks(
          `${song.title} ${song.artist}`,
          10,
        )

      const normalizedTitle =
        song.title
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .trim()

      const normalizedArtist =
        song.artist
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .trim()

      const match =
        results.find(track => {
          const trackTitle =
            track.title
              .toLowerCase()
              .replace(/[^\w\s]/g, '')
              .trim()

          const trackArtist =
            track.artist
              .toLowerCase()
              .replace(/[^\w\s]/g, '')
              .trim()

          return (
            trackTitle ===
              normalizedTitle &&
            trackArtist ===
              normalizedArtist &&
            track.previewUrl
          )
        })

      if (!match) {
        console.log(
          `  SKIPPED: No matching Deezer track with preview`,
        )

        skipped++

        continue
      }

      const documentId =
        `${era}_${song.title}_${song.artist}`
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
          era,
          provider: 'deezer',
          providerSongId:
            match.providerId,
          createdAt: new Date(),
        })

      console.log(
        `  ADDED: ${song.title}`,
      )

      added++
    } catch (error) {
      console.error(
        `  ERROR: ${song.title}`,
        error,
      )

      skipped++
    }
  }

  console.log('\n==============================')
  console.log(`Era: ${era}`)
  console.log(`Added: ${added}`)
  console.log(`Skipped: ${skipped}`)
  console.log('==============================\n')
}

seedEra()
  .then(() => {
    console.log(
      'Seeding complete.',
    )

    process.exit(0)
  })
  .catch(error => {
    console.error(
      'Seeding failed:',
      error,
    )

    process.exit(1)
  })