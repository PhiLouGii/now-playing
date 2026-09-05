import { deezerMusicProvider } from './deezerMusicProvider.js'

async function test() {
  const tracks =
    await deezerMusicProvider.searchTracks(
      'Brianstorm Arctic Monkeys',
      1,
    )

  const track = tracks[0]

  if (!track) {
    throw new Error('No track found')
  }

  if (!track.previewUrl) {
    throw new Error('Track has no preview URL')
  }

  console.log('Song:', track.title)
  console.log('Artist:', track.artist)
  console.log('Preview URL:', track.previewUrl)
}

test().catch((error) => {
  console.error(error)
  process.exit(1)
})