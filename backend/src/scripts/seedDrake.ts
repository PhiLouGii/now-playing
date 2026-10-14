
import { db } from '../config/firebase.js'
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'
import { isPlayableMusicTrack } from '../services/music/musicTrackFilter.js'
import type { MusicTrack } from '../services/music/musicProvider.js'

const DRAKE_ARTIST_ID = '67927442'
const DRAKE_ARTIST_NAME = 'Drake'

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

async function seedDrake() {
  console.log('\n================================')
  console.log('NOW PLAYING — DRAKE CATALOGUE SEED')
  console.log(`Deezer artist ID: ${DRAKE_ARTIST_ID}`)
  console.log('================================\n')

  /*
   * Fetch top tracks and the album discography independently.
   * One source can still succeed if the other fails.
   */
  const [discographyResult, topTracksResult] =
    await Promise.allSettled([
      deezerMusicProvider.getArtistDiscography(
        DRAKE_ARTIST_ID,
      ),
      deezerMusicProvider.getArtistTopTracks(
        DRAKE_ARTIST_ID,
        100,
      ),
    ])

  const discographyTracks =
    discographyResult.status === 'fulfilled'
      ? discographyResult.value
      : []

  const topTracks =
    topTracksResult.status === 'fulfilled'
      ? topTracksResult.value
      : []

  if (discographyResult.status === 'rejected') {
    console.error(
      'Could not load Drake discography:',
      discographyResult.reason,
    )
  }

  if (topTracksResult.status === 'rejected') {
    console.error(
      'Could not load Drake top tracks:',
      topTracksResult.reason,
    )
  }

  if (
    discographyResult.status === 'rejected' &&
    topTracksResult.status === 'rejected'
  ) {
    throw new Error(
      'Both Deezer catalogue requests failed. Nothing was seeded.',
    )
  }

  console.log(
    `Discography results: ${discographyTracks.length}`,
  )
  console.log(
    `Top-track results: ${topTracks.length}`,
  )

  /*
   * Merge by provider track ID.
   * Only Drake's own artist catalogue is eligible.
   */
  const tracksById = new Map<string, MusicTrack>()

  for (const track of [
    ...topTracks,
    ...discographyTracks,
  ]) {
    if (!isPlayableMusicTrack(track)) {
      continue
    }

    if (
      normalize(track.artist) !==
      normalize(DRAKE_ARTIST_NAME)
    ) {
      continue
    }

    const providerSongId = String(
      track.providerId ?? track.id,
    )

    if (!providerSongId) {
      continue
    }

    if (!tracksById.has(providerSongId)) {
      tracksById.set(providerSongId, track)
    }
  }

  const uniqueTracks = [...tracksById.values()]

  console.log(
    `Unique playable Drake tracks to process: ${uniqueTracks.length}\n`,
  )

  let added = 0
  let updated = 0
  let existing = 0
  let skipped = 0
  let errors = 0

  for (const track of uniqueTracks) {
    try {
      const providerSongId = String(
        track.providerId ?? track.id,
      )

      console.log(
        `Processing: ${track.title} — ${track.artist}`,
      )

      const existingSong =
        await findExistingSong(providerSongId)

      if (existingSong) {
        const data = existingSong.data()

        /*
         * Update only the Deezer artist identifier.
         * Existing era, genre, theme and other metadata
         * remain untouched.
         */
        if (
          data.deezerArtistId !== DRAKE_ARTIST_ID
        ) {
          await existingSong.ref.update({
            deezerArtistId: DRAKE_ARTIST_ID,
          })

          console.log(
            `  UPDATED: linked existing song to Drake's Deezer ID`,
          )
          updated++
        } else {
          console.log('  EXISTS: already seeded')
          existing++
        }

        continue
      }

      const baseId = `drake_${slugify(track.title)}_${slugify(track.artist)}`
      let documentId = baseId

      /*
       * Avoid overwriting another document if two different
       * provider tracks produce the same slug.
       */
      const slugDocument = await db
        .collection('songs')
        .doc(documentId)
        .get()

      if (slugDocument.exists) {
        documentId = `${baseId}_${providerSongId}`
      }

      const releaseYear = track.releaseYear ?? null

      await db
        .collection('songs')
        .doc(documentId)
        .set({
          title: track.title,
          artist: DRAKE_ARTIST_NAME,
          album: track.album ?? null,
          year: releaseYear,
          era: releaseYear
            ? `${Math.floor(releaseYear / 10) * 10}s`
            : null,
          genres: Array.isArray(track.genres)
            ? track.genres
            : [],
          themes: [],
          provider: 'deezer',
          providerSongId,
          deezerArtistId: DRAKE_ARTIST_ID,
          createdAt: new Date(),
        })

      console.log('  ADDED')
      added++
    } catch (error) {
      console.error(
        `  ERROR: ${track.title} — ${track.artist}`,
        error,
      )
      errors++
    }
  }

  console.log('\n================================')
  console.log('DRAKE SEED SUMMARY')
  console.log(`Catalogue tracks: ${uniqueTracks.length}`)
  console.log(`Added: ${added}`)
  console.log(`Updated: ${updated}`)
  console.log(`Already existed: ${existing}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)
  console.log('================================\n')
}

seedDrake()
  .then(() => {
    console.log('Drake seeding complete.')
    process.exit(0)
  })
  .catch(error => {
    console.error('Drake seeding failed:', error)
    process.exit(1)
  })
