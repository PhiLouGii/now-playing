
import { db } from '../config/firebase.js'
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'
import { isPlayableMusicTrack } from '../services/music/musicTrackFilter.js'
import { chrisBrownSongs } from '../data/artists/chrisBrown.js'

const CHRIS_BROWN_ARTIST_ID = '1560'
const CHRIS_BROWN_ARTIST_NAME = 'Chris Brown'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

async function findExistingSong(providerSongId: string) {
  const snapshot = await db
    .collection('songs')
    .where('providerSongId', '==', providerSongId)
    .limit(1)
    .get()

  return snapshot.empty ? null : snapshot.docs[0]
}

async function seedChrisBrown() {
  console.log('\n================================')
  console.log('NOW PLAYING — CURATED CHRIS BROWN SEED')
  console.log(`Deezer artist ID: ${CHRIS_BROWN_ARTIST_ID}`)
  console.log(`Curated candidates: ${chrisBrownSongs.length}`)
  console.log('================================\n')

  let added = 0
  let updated = 0
  let existing = 0
  let skipped = 0
  let errors = 0

  for (const title of chrisBrownSongs) {
    try {
      console.log(`\nSearching Deezer: ${title}`)

      const results = await deezerMusicProvider.searchTracks(
        `${title} Chris Brown`,
        10,
      )

      const normalizedTitle = normalize(title)
      const normalizedArtist = normalize(CHRIS_BROWN_ARTIST_NAME)

      const track = results.find(candidate => {
        return (
          normalize(candidate.title) === normalizedTitle &&
          normalize(candidate.artist) === normalizedArtist &&
          isPlayableMusicTrack(candidate)
        )
      })

      // Print Deezer candidates when no exact playable match is found.
      if (!track) {
        console.log(
          '  SKIPPED: No exact Chris Brown match with a playable preview',
        )
        console.log('  Deezer results:')

        if (results.length === 0) {
          console.log('    No results returned.')
        }

        results.forEach((candidate, index) => {
          const titleMatches =
            normalize(candidate.title) === normalizedTitle

          const artistMatches =
            normalize(candidate.artist) === normalizedArtist

          const playable = isPlayableMusicTrack(candidate)

          console.log(
            `    ${index + 1}. ${candidate.title} — ${candidate.artist}` +
              ` | title match: ${titleMatches ? 'YES' : 'NO'}` +
              ` | artist match: ${artistMatches ? 'YES' : 'NO'}` +
              ` | preview: ${candidate.previewUrl ? 'YES' : 'NO'}` +
              ` | playable: ${playable ? 'YES' : 'NO'}` +
              ` | ID: ${candidate.providerId ?? candidate.id}`,
          )
        })

        skipped++
        continue
      }

      const providerSongId = String(
        track.providerId ?? track.id,
      )

      if (!providerSongId || providerSongId === 'undefined') {
        console.log('  SKIPPED: Missing provider track ID')
        skipped++
        continue
      }

      console.log(
        `  MATCHED: ${track.title} — ${track.artist}` +
          ` | preview: ${track.previewUrl ? 'YES' : 'NO'}` +
          ` | ID: ${providerSongId}`,
      )

      const existingSong = await findExistingSong(providerSongId)

      if (existingSong) {
        const data = existingSong.data()

        // Don't associate a provider ID with a different song.
        if (
          normalize(String(data.title ?? '')) !== normalize(track.title) ||
          normalize(String(data.artist ?? '')) !==
            normalize(CHRIS_BROWN_ARTIST_NAME)
        ) {
          console.log(
            '  SKIPPED: Provider ID exists with different saved metadata',
          )
          skipped++
          continue
        }

        const needsUpdate =
  data.artistKey !== 'chrisbrown' ||
  String(data.deezerArtistId ?? '') !== CHRIS_BROWN_ARTIST_ID

        if (!needsUpdate) {
          console.log('  EXISTS: Already linked to Chris Brown catalogue')
          existing++
          continue
        }

        await existingSong.ref.update({
          artistKey: 'Chris Brown',
          deezerArtistId: CHRIS_BROWN_ARTIST_ID,
        })

        console.log('  UPDATED: Linked existing song to Chris Brown catalogue')
        updated++
        continue
      }

      const baseId = `chrisbrown_${slugify(track.title)}`
let documentId = baseId

const baseDocument = await db
  .collection('songs')
  .doc(documentId)
  .get()

if (baseDocument.exists) {
  documentId = `${baseId}_${providerSongId}`

  const fallbackDocument = await db
    .collection('songs')
    .doc(documentId)
    .get()

  if (fallbackDocument.exists) {
    console.log(
      '  SKIPPED: Document ID collision. Existing document preserved.',
    )
    skipped++
    continue
  }
}

      const year = track.releaseYear ?? null

      await db.collection('songs').doc(documentId).set({
        title: track.title,
        artist: CHRIS_BROWN_ARTIST_NAME,
        artistKey: 'chrisbrown',
        album: track.album ?? null,
        year,
        era: year ? `${Math.floor(year / 10) * 10}s` : null,
        genres: Array.isArray(track.genres) ? track.genres : [],
        themes: [],
        provider: 'deezer',
        providerSongId,
        deezerArtistId: CHRIS_BROWN_ARTIST_ID,
        createdAt: new Date(),
      })

      console.log(`  ADDED: ${track.title}`)
      added++
    } catch (error) {
      console.error(`  ERROR: ${title}`, error)
      errors++
    }
  }

  console.log('\n================================')
  console.log('CHRIS BROWN SEED SUMMARY')
  console.log(`Candidates: ${chrisBrownSongs.length}`)
  console.log(`Added: ${added}`)
  console.log(`Updated: ${updated}`)
  console.log(`Already linked: ${existing}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)
  console.log('================================\n')
}

seedChrisBrown()
  .then(() => {
    console.log('Chris Brown seeding complete.')
    process.exit(0)
  })
  .catch(error => {
    console.error('Chris Brown seeding failed:', error)
    process.exit(1)
  })
