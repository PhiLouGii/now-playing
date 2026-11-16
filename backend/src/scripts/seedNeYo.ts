
import { db } from '../config/firebase.js'
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'
import { isPlayableMusicTrack } from '../services/music/musicTrackFilter.js'
import { neYoSongs } from '../data/artists/neYo.js'

const NEYO_ARTIST_NAME = 'Ne-Yo'
const NEYO_ARTIST_KEY = 'neyo'

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

async function resolveNeYoArtistId(): Promise<string> {
  console.log('Resolving Ne-Yo Deezer artist ID...')

  const artists = await deezerMusicProvider.searchArtists(
    NEYO_ARTIST_NAME,
    10,
  )

  const artist = artists.find(
    candidate =>
      normalize(candidate.name) === normalize(NEYO_ARTIST_NAME),
  )

  if (!artist) {
    throw new Error(
      'Could not find an exact Ne-Yo match in Deezer artist search.',
    )
  }

  console.log(`Found artist: ${artist.name}`)
  console.log(`Deezer artist ID: ${artist.id}`)

  return String(artist.id)
}

async function seedNeYo() {
  console.log('\n================================')
  console.log('NOW PLAYING — CURATED NE-YO SEED')
  console.log(`Curated candidates: ${neYoSongs.length}`)
  console.log('================================\n')

  const artistId = await resolveNeYoArtistId()

  let added = 0
  let updated = 0
  let existing = 0
  let skipped = 0
  let errors = 0

  for (const title of neYoSongs) {
    try {
      console.log(`\nSearching Deezer: ${title}`)

      const results = await deezerMusicProvider.searchTracks(
        `${title} Ne-Yo`,
        10,
      )

      const normalizedTitle = normalize(title)
      const normalizedArtist = normalize(NEYO_ARTIST_NAME)

      const track = results.find(candidate =>
        normalize(candidate.title) === normalizedTitle &&
        normalize(candidate.artist) === normalizedArtist &&
        isPlayableMusicTrack(candidate),
      )

      if (!track) {
        console.log(
          '  SKIPPED: No exact Ne-Yo match with a playable preview',
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
        ` | preview: YES` +
        ` | ID: ${providerSongId}`,
      )

      const existingSong = await findExistingSong(providerSongId)

      if (existingSong) {
        const data = existingSong.data()

        if (
          normalize(String(data.title ?? '')) !==
            normalize(track.title) ||
          normalize(String(data.artist ?? '')) !== normalizedArtist
        ) {
          console.log(
            '  SKIPPED: Provider ID exists with different saved metadata',
          )
          skipped++
          continue
        }

        const needsUpdate =
          data.artistKey !== NEYO_ARTIST_KEY ||
          String(data.deezerArtistId ?? '') !== artistId

        if (!needsUpdate) {
          console.log('  EXISTS: Already linked to Ne-Yo catalogue')
          existing++
          continue
        }

        await existingSong.ref.update({
          artistKey: NEYO_ARTIST_KEY,
          deezerArtistId: artistId,
        })

        console.log('  UPDATED: Linked existing song to Ne-Yo catalogue')
        updated++
        continue
      }

      const baseId = `neyo_${slugify(track.title)}`
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
            `  SKIPPED: Document ID already exists: ${documentId}`,
          )
          skipped++
          continue
        }
      }

      const year = track.releaseYear ?? null

      await db.collection('songs').doc(documentId).set({
        title: track.title,
        artist: NEYO_ARTIST_NAME,
        artistKey: NEYO_ARTIST_KEY,
        album: track.album ?? null,
        year,
        era: year ? `${Math.floor(year / 10) * 10}s` : null,
        genres: Array.isArray(track.genres) ? track.genres : [],
        themes: [],
        provider: 'deezer',
        providerSongId,
        deezerArtistId: artistId,
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
  console.log('NE-YO SEED SUMMARY')
  console.log(`Candidates: ${neYoSongs.length}`)
  console.log(`Added: ${added}`)
  console.log(`Updated: ${updated}`)
  console.log(`Already linked: ${existing}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)
  console.log('================================\n')
}

seedNeYo()
  .then(() => {
    console.log('Ne-Yo seeding complete.')
    process.exit(0)
  })
  .catch(error => {
    console.error('Ne-Yo seeding failed:', error)
    process.exit(1)
  })
