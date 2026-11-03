
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

// Explicitly preferred Deezer recordings.
// Add IDs here whenever a particular song needs manual selection.
const preferredTrackIds: Record<string, string> = {
  'Running Up That Hill': '2173954687',
  Dreams: '63480987',

  'Die For You': '136889432',
  'Wrecking Ball': '71137166',
}

const excludedVersionTerms = [
  'remix',
  'sped up',
  'slowed',
  'slowed reverb',
  'live',
  'acoustic',
  'instrumental',
  'karaoke',
  'tribute',
  'cover',
  'nightcore',
  'mashup',
  'demo',
  'rehearsal',
  'radio edit',
  'edit',
  'extended mix',
  'club mix',
]

type Candidate = {
  track: Awaited<
    ReturnType<typeof deezerMusicProvider.searchTracks>
  >[number]
  score: number
  reasons: string[]
}

function scoreCandidate(
  track: Candidate['track'],
  expectedTitle: string,
): Candidate {
  const title = normalize(track.title)
  const album = normalize(track.album)

  let score = 100
  const reasons: string[] = []

  // Exact title is preferable to a title variation.
  if (title === expectedTitle) {
    score += 30
    reasons.push('exact title')
  } else {
    score -= 10
    reasons.push('title variation')
  }

  // Penalise alternate recording versions.
  for (const term of excludedVersionTerms) {
    if (
      title.includes(term) ||
      album.includes(term)
    ) {
      score -= 100
      reasons.push(`alternate version: ${term}`)
    }
  }

  // Prefer standard studio albums over compilations.
  const compilationTerms = [
    'greatest hits',
    'best of',
    'collection',
    'essential',
    'anthology',
    'soundtrack',
  ]

  for (const term of compilationTerms) {
    if (album.includes(term)) {
      score -= 5
      reasons.push(`compilation album: ${term}`)
    }
  }

  return {
    track,
    score,
    reasons,
  }
}

type SeedStatus =
  | 'added'
  | 'would-add'
  | 'already-seeded'
  | 'no-match'
  | 'error'

async function seedGuessTheYear() {
  const dryRun = process.argv.includes('--dry-run')

  console.log('\nSeeding Guess the Year...')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Songs in source list: ${guessTheYearSongs.length}\n`)

  const counts: Record<SeedStatus, number> = {
    added: 0,
    'would-add': 0,
    'already-seeded': 0,
    'no-match': 0,
    error: 0,
  }

  for (const song of guessTheYearSongs) {
    try {
      console.log(`\nSearching: ${song.title} — ${song.artist}`)

      const documentId =
        `guess_the_year_${song.title}_${song.artist}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')

      const docRef = db.collection('songs').doc(documentId)
      const existingDoc = await docRef.get()

      if (existingDoc.exists) {
        console.log('  ALREADY SEEDED: Document exists.')
        counts['already-seeded']++
        continue
      }

      const results = await deezerMusicProvider.searchTracks(
        `${song.title} ${song.artist}`,
        25,
      )

      const expectedTitle = normalize(song.title)
      const expectedArtist = normalize(song.artist)

      const matches = results.filter((track) => {
        const actualTitle = normalize(track.title)
        const actualArtist = normalize(track.artist)

        const titleMatches =
          actualTitle === expectedTitle ||
          actualTitle.startsWith(`${expectedTitle} `)

        return (
          titleMatches &&
          actualArtist === expectedArtist &&
          Boolean(track.previewUrl) &&
          Boolean(track.providerId)
        )
      })

      if (matches.length === 0) {
        console.log('  NO MATCH: No matching playable recording.')
        counts['no-match']++
        continue
      }

      const preferredId = preferredTrackIds[song.title]

      let selectedTrack: typeof matches[number] | undefined

      if (preferredId) {
        selectedTrack = matches.find(
          (track) => track.providerId === preferredId,
        )
      }

      if (preferredId && !selectedTrack) {
        console.log(
          `  Preferred recording ${preferredId} was not returned. Using automatic selection.`,
        )
      }

      if (!selectedTrack) {
        const ranked = matches
          .map((track) => scoreCandidate(track, expectedTitle))
          .sort((a, b) => b.score - a.score)

        selectedTrack = ranked[0].track

        console.log(
          `  Selected automatically: ${ranked[0].score} points`,
        )
        console.log(
          `  Selection reasons: ${ranked[0].reasons.join(', ') || 'standard recording'}`,
        )

        if (ranked.length > 1) {
          console.log(
            `  Other candidates considered: ${ranked.length - 1}`,
          )
        }
      } else {
        console.log('  Selected using preferred Deezer ID.')
      }

      console.log(
        `  Recording: ${selectedTrack.title} — ${selectedTrack.artist}`,
      )
      console.log(`  Album: ${selectedTrack.album}`)
      console.log(`  Deezer ID: ${selectedTrack.providerId}`)
      console.log(`  Curated year: ${song.year}`)

      if (dryRun) {
        console.log('  WOULD ADD: No Firestore changes made.')
        counts['would-add']++
        continue
      }

      await docRef.create({
        title: song.title,
        artist: song.artist,
        album: selectedTrack.album,
        year: song.year,
        era: `${Math.floor(song.year / 10) * 10}s`,
        provider: 'deezer',
        providerSongId: selectedTrack.providerId,
        gameModes: ['guess-the-year'],
        createdAt: new Date(),
      })

      console.log(`  ADDED: ${song.title} (${song.year})`)
      counts.added++
    } catch (error) {
      console.error(`  ERROR: ${song.title}`, error)
      counts.error++
    }
  }

  console.log('\n========== SEED SUMMARY ==========')
  console.log(`Added:          ${counts.added}`)
  console.log(`Would add:      ${counts['would-add']}`)
  console.log(`Already seeded: ${counts['already-seeded']}`)
  console.log(`No match:       ${counts['no-match']}`)
  console.log(`Errors:         ${counts.error}`)
  console.log('==================================\n')
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
