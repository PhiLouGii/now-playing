
import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

async function testDrakeArtist() {
  const artistId = '246791'

  const [discography, topTracks] = await Promise.all([
    deezerMusicProvider.getArtistDiscography(artistId),
    deezerMusicProvider.getArtistTopTracks(artistId, 50),
  ])

  const suspiciousTracks = discography.filter(
    (track) => normalize(track.artist) !== 'drake',
  )

  const knownHits = [
    'One Dance',
    "God's Plan",
    'Hotline Bling',
    'Passionfruit',
    'Marvins Room',
    'Rich Flex',
    'First Person Shooter',
  ]

  console.log('\nDRAKE CATALOGUE CHECK')
  console.log('Discography tracks:', discography.length)
  console.log('Top tracks:', topTracks.length)
  console.log('Discography tracks credited to another artist:', suspiciousTracks.length)

  console.log('\nKnown hits found in discography:')
  console.table(
    knownHits.map((title) => ({
      title,
      found: discography.some(
        (track) => normalize(track.title) === normalize(title),
      ),
    })),
  )

  console.log('\nTop tracks:')
  console.table(
    topTracks.map((track) => ({
      title: track.title,
      artist: track.artist,
      preview: Boolean(track.previewUrl),
    })),
  )

  console.log('\nFirst 20 discography tracks:')
  console.table(
    discography.slice(0, 20).map((track) => ({
      title: track.title,
      artist: track.artist,
      preview: Boolean(track.previewUrl),
    })),
  )

  console.log('\nTracks credited to other artists:')
  console.table(
    suspiciousTracks.slice(0, 20).map((track) => ({
      title: track.title,
      artist: track.artist,
    })),
  )
}

testDrakeArtist().catch(console.error)
