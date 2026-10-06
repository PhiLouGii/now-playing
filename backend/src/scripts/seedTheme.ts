import { db } from '../config/firebase.js'
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'
import {
  themeLibraries,
  type Theme,
} from '../data/themes/index.js'

type SeedSong = {
  title: string
  artist: string
}

const theme = process.argv[2] as Theme

if (!theme || !(theme in themeLibraries)) {
  console.error(
    'Please provide a valid theme:',
  )

  console.error(
    Object.keys(themeLibraries).join(', '),
  )

  process.exit(1)
}

const songs =
  themeLibraries[theme] as readonly SeedSong[]

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
}

async function findExistingSong(
  providerSongId: string,
) {
  const snapshot =
    await db
      .collection('songs')
      .where(
        'providerSongId',
        '==',
        providerSongId,
      )
      .limit(1)
      .get()

  if (snapshot.empty) {
    return null
  }

  return snapshot.docs[0]
}

async function seedTheme() {
  console.log(
    `\nSeeding theme: ${theme}`,
  )

  console.log(
    `Songs in source list: ${songs.length}\n`,
  )

  let added = 0
  let updated = 0
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
        normalize(song.title)

      const normalizedArtist =
        normalize(song.artist)

      const match =
        results.find(track => {
          const trackTitle =
            normalize(track.title)

          const trackArtist =
            normalize(track.artist)

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

      const existingSong =
        await findExistingSong(
          match.providerId,
        )

      if (existingSong) {
        const existingData =
          existingSong.data()

        const existingThemes =
          Array.isArray(
            existingData.themes,
          )
            ? existingData.themes
            : []

        if (
          existingThemes.includes(theme)
        ) {
          console.log(
            `  EXISTS: ${song.title}`,
          )

          skipped++
        } else {
          await existingSong.ref.update({
            themes: [
              ...existingThemes,
              theme,
            ],
          })

          console.log(
            `  UPDATED: ${song.title} → added ${theme}`,
          )

          updated++
        }

        continue
      }

      const documentId =
        `${song.title}_${song.artist}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(
            /^_+|_+$/g,
            '',
          )

      await db
        .collection('songs')
        .doc(documentId)
        .set({
          title: song.title,
          artist: song.artist,
          album: match.album,
          year: match.releaseYear,
          era: match.releaseYear
            ? `${Math.floor(
                match.releaseYear / 10,
              ) * 10}s`
            : null,
          genres: [],
          themes: [theme],
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

  console.log(
    '\n==============================',
  )

  console.log(
    `Theme: ${theme}`,
  )

  console.log(
    `Added: ${added}`,
  )

  console.log(
    `Updated: ${updated}`,
  )

  console.log(
    `Skipped: ${skipped}`,
  )

  console.log(
    '==============================\n',
  )
}

seedTheme()
  .then(() => {
    console.log(
      'Theme seeding complete.',
    )

    process.exit(0)
  })
  .catch(error => {
    console.error(
      'Theme seeding failed:',
      error,
    )

    process.exit(1)
  })