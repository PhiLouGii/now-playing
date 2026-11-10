import { db } from '../config/firebase.js'
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'
import { isPlayableMusicTrack } from '../services/music/musicTrackFilter.js'
import { samSmithSongs } from '../data/artists/samSmith.js'

const SAM_SMITH_ARTIST_ID = '1097709'
const SAM_SMITH_ARTIST_NAME = 'Sam Smith'

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

async function seedSamSmith() {
  console.log('\n================================')
  console.log('NOW PLAYING — CURATED SAM SMITH SEED')
  console.log(`Deezer artist ID: ${SAM_SMITH_ARTIST_ID}`)
  console.log(`Curated candidates: ${samSmithSongs.length}`)
  console.log('================================\n')

  let added = 0
  let updated = 0
  let existing = 0
  let skipped = 0
  let errors = 0

  for (const title of samSmithSongs) {
    try {
      console.log(`\nSearching Deezer: ${title}`)

      const results = await deezerMusicProvider.searchTracks(
        `${title} Sam Smith`,
        10,
      )

      const normalizedTitle = normalize(title)
      const normalizedArtist = normalize(SAM_SMITH_ARTIST_NAME)

      const track = results.find(candidate => {
        return (
          normalize(candidate.title) === normalizedTitle &&
          normalize(candidate.artist) === normalizedArtist &&
          isPlayableMusicTrack(candidate)
        )
      })

      if (!track) {
        console.log(
          '  SKIPPED: No exact Sam Smith match with a playable preview',
        )

        console.log('  Deezer results:')

        if (results.length === 0) {
          console.log('    No results returned.')
        }

        results.forEach((candidate, index) => {
          console.log(
            `    ${index + 1}. ${candidate.title} — ${candidate.artist}` +
              ` | title match: ${
                normalize(candidate.title) === normalizedTitle ? 'YES' : 'NO'
              }` +
              ` | artist match: ${
                normalize(candidate.artist) === normalizedArtist ? 'YES' : 'NO'
              }` +
              ` | preview: ${candidate.previewUrl ? 'YES' : 'NO'}` +
              ` | playable: ${
                isPlayableMusicTrack(candidate) ? 'YES' : 'NO'
              }` +
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

        if (
          normalize(String(data.title ?? '')) !==
            normalize(track.title) ||
          normalize(String(data.artist ?? '')) !==
            normalizedArtist
        ) {
          console.log(
            '  SKIPPED: Provider ID exists with different saved metadata',
          )
          skipped++
          continue
        }

        const needsUpdate =
          data.artistKey !== 'samsmith' ||
          String(data.deezerArtistId ?? '') !== SAM_SMITH_ARTIST_ID

        if (!needsUpdate) {
          console.log('  EXISTS: Already linked to Sam Smith catalogue')
          existing++
          continue
        }

        await existingSong.ref.update({
          artistKey: 'samsmith',
          deezerArtistId: SAM_SMITH_ARTIST_ID,
        })

        console.log('  UPDATED: Linked existing song to Sam Smith catalogue')
        updated++
        continue
      }

      const baseId = `samsmith_${slugify(track.title)}`
      let documentId = baseId

      const slugDocument = await db
        .collection('songs')
        .doc(documentId)
        .get()

      if (slugDocument.exists) {
        documentId = `${baseId}_${providerSongId}`

        const fallbackDocument = await db
          .collection('songs')
          .doc(documentId)
          .get()

        if (fallbackDocument.exists) {
          console.log(
            `  SKIPPED: Document ID already exists: ${documentId}`,
          )
          skipped++
          continue
        }
      }

      const year = track.releaseYear ?? null

      await db.collection('songs').doc(documentId).set({
        title: track.title,
        artist: SAM_SMITH_ARTIST_NAME,
        artistKey: 'samsmith',
        album: track.album ?? null,
        year,
        era: year ? `${Math.floor(year / 10) * 10}s` : null,
        genres: Array.isArray(track.genres) ? track.genres : [],
        themes: [],
        provider: 'deezer',
        providerSongId,
        deezerArtistId: SAM_SMITH_ARTIST_ID,
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
  console.log('SAM SMITH SEED SUMMARY')
  console.log(`Candidates: ${samSmithSongs.length}`)
  console.log(`Added: ${added}`)
  console.log(`Updated: ${updated}`)
  console.log(`Already linked: ${existing}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)
  console.log('================================\n')
}

seedSamSmith()
  .then(() => {
    console.log('Sam Smith seeding complete.')
    process.exit(0)
  })
  .catch(error => {
    console.error('Sam Smith seeding failed:', error)
    process.exit(1)
  })