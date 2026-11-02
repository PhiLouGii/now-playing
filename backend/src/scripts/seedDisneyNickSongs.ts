
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { db } from '../config/firebase.js'
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'
import { isPlayableMusicTrack } from '../services/music/musicTrackFilter.js'
import { disneyNickSongs } from '../data/songs/disneyNickSongs.js'

const COLLECTION = 'songs'
const CATEGORY_THEME = 'disney-nick'

type SeedStatus = 'ADDED' | 'ALREADY_EXISTS' | 'NOT_FOUND' | 'ERROR'

type ReportEntry = {
  title: string
  artist: string
  status: SeedStatus
  reason?: string
  deezerMatches?: {
    title: string
    artist: string
    album?: string | null
    providerSongId: string
    playable: boolean
  }[]
  deezerSuggestions?: {
  title: string
  artist: string
  album?: string | null
  providerSongId: string
  playable: boolean
}[]
}

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

function getProviderSongId(track: any): string {
  return String(track.providerId ?? track.id)
}

async function findExistingSong(providerSongId: string) {
  const snapshot = await db
    .collection(COLLECTION)
    .where('providerSongId', '==', providerSongId)
    .limit(1)
    .get()

  return snapshot.empty ? null : snapshot.docs[0]
}

async function seedDisneyNickSongs() {
  const report: ReportEntry[] = []

  const reportDirectory = path.resolve(process.cwd(), 'reports')
  await mkdir(reportDirectory, { recursive: true })

  for (const song of disneyNickSongs) {
    try {
      const query = `${song.title} ${song.artist}`
      const results = await deezerMusicProvider.searchTracks(query, 10)

      const exactMatches = results.filter((track: any) =>
        normalize(track.title) === normalize(song.title) &&
        normalize(track.artist) === normalize(song.artist)
      )

      const playableMatches = exactMatches.filter((track: any) =>
        isPlayableMusicTrack(track)
      )

      const reportMatches = exactMatches.map((track: any) => ({
        title: track.title,
        artist: track.artist,
        album: track.album ?? null,
        providerSongId: getProviderSongId(track),
        playable: isPlayableMusicTrack(track),
      }))
console.log({
  requested: `${song.artist} — ${song.title}`,
  exactMatches: exactMatches.length,
  playableMatches: playableMatches.length,
  results: results.slice(0, 3).map((track: any) => ({
    title: track.title,
    artist: track.artist,
    providerSongId: getProviderSongId(track),
    playable: isPlayableMusicTrack(track),
  })),
})
      
if (playableMatches.length === 0) {
  // Keep the original search results, even if the
  // title or artist does not match exactly.
  const suggestions = results.slice(0, 5).map((track: any) => ({
    title: track.title,
    artist: track.artist,
    album: track.album ?? null,
    providerSongId: getProviderSongId(track),
    playable: isPlayableMusicTrack(track),
  }))

  report.push({
    title: song.title,
    artist: song.artist,
    status: 'NOT_FOUND',
    reason: exactMatches.length
      ? 'Exact title and artist found, but no playable track.'
      : 'No exact title and artist match found on Deezer.',
    deezerMatches: reportMatches,
    deezerSuggestions: suggestions,
  })

  console.log(
    `[NOT FOUND] ${song.artist} — ${song.title}` +
    (suggestions.length
      ? ` | Deezer: ${suggestions
          .map(track => `${track.artist} - ${track.title}`)
          .join('; ')}`
      : ' | No Deezer results')
  )

  continue
}


      if (playableMatches.length > 1) {
        report.push({
          title: song.title,
          artist: song.artist,
          status: 'NOT_FOUND',
          reason: 'Multiple playable exact matches; needs manual review.',
          deezerMatches: playableMatches.map((track: any) => ({
            title: track.title,
            artist: track.artist,
            album: track.album ?? null,
            providerSongId: getProviderSongId(track),
            playable: true,
          })),
        })

        console.log(`[NOT FOUND] ${song.artist} — ${song.title} (multiple matches)`)
        continue
      }

      const track = playableMatches[0]
      const providerSongId = getProviderSongId(track)
      const existing = await findExistingSong(providerSongId)

      if (existing) {
  const existingData = existing.data()

  const themes = Array.isArray(existingData.themes)
    ? existingData.themes
    : []

  await existing.ref.update({
    themes: themes.includes(CATEGORY_THEME)
      ? themes
      : [...themes, CATEGORY_THEME],

    title: existingData.title || track.title,
    artist: existingData.artist || track.artist,
    artistKey:
      existingData.artistKey ||
      normalize(track.artist).replace(/\s+/g, '-'),
    album: existingData.album || track.album || null,

    year: existingData.year ?? track.releaseYear ?? null,

    genres:
      Array.isArray(existingData.genres) &&
      existingData.genres.length > 0
        ? existingData.genres
        : Array.isArray(track.genres)
          ? track.genres
          : [],

    provider: existingData.provider || 'deezer',
    providerSongId,

    previewUrl:
      existingData.previewUrl || track.previewUrl || null,

    artworkUrl:
      existingData.artworkUrl || track.artworkUrl || null,
  })

  report.push({
    title: song.title,
    artist: song.artist,
    status: 'ALREADY_EXISTS',
    reason: 'Existing track updated; Disney/Nick theme and metadata ensured.',
    deezerMatches: [{
      title: track.title,
      artist: track.artist,
      album: track.album ?? null,
      providerSongId,
      playable: true,
    }],
  })

  console.log(`[UPDATED] ${song.artist} — ${song.title}`)
  continue
}

      await db.collection(COLLECTION).add({
        title: track.title,
        artist: track.artist,
        artistKey: normalize(track.artist).replace(/\s+/g, '-'),
        album: track.album ?? null,
        year: track.releaseYear ?? null,
        era: null,
        genres: Array.isArray(track.genres) ? track.genres : [],
        themes: [CATEGORY_THEME],
        provider: 'deezer',
        providerSongId,
        previewUrl: track.previewUrl ?? null,
        artworkUrl: track.artworkUrl ?? null,
        createdAt: new Date(),
      })

      report.push({
        title: song.title,
        artist: song.artist,
        status: 'ADDED',
        deezerMatches: [{
          title: track.title,
          artist: track.artist,
          album: track.album ?? null,
          providerSongId,
          playable: true,
        }],
      })

      console.log(`[ADDED] ${song.artist} — ${song.title}`)
    } catch (error) {
      report.push({
        title: song.title,
        artist: song.artist,
        status: 'ERROR',
        reason: error instanceof Error ? error.message : String(error),
      })

      console.log(`[ERROR] ${song.artist} — ${song.title}`)
    }
  }

  const counts = {
    added: report.filter(item => item.status === 'ADDED').length,
    skipped: report.filter(item => item.status === 'ALREADY_EXISTS').length,
    notFound: report.filter(item => item.status === 'NOT_FOUND').length,
    errors: report.filter(item => item.status === 'ERROR').length,
  }

  const reportPath = path.join(
    reportDirectory,
    'disneyNickSeedReport.json',
  )

  await writeFile(
    reportPath,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      summary: counts,
      results: report,
    }, null, 2),
    'utf8',
  )

  console.log('\nDisney/Nick seeding complete.')
  console.log(
    `${counts.added} added, ${counts.skipped} skipped, ` +
    `${counts.notFound} not found, ${counts.errors} errors.`,
  )
  console.log(`Report saved to ${reportPath}`)
}

seedDisneyNickSongs().catch(error => {
  console.error('Seeding failed:', error)
  process.exitCode = 1
})
