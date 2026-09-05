import { lastFmMusicProvider } from './lastFmMusicProvider.js'

async function test() {
  const tracks =
    await lastFmMusicProvider.getSimilarTracks(
      'Espresso',
      'Sabrina Carpenter',
      10,
    )

  console.log(
    JSON.stringify(
      tracks,
      null,
      2,
    ),
  )
}

test().catch((error) => {
  console.error(error)
  process.exit(1)
})