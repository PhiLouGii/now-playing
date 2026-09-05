import { deezerMusicProvider } from './deezerMusicProvider.js'

async function test() {
  const tracks =
    await deezerMusicProvider.searchTracks(
      'Brianstorm Arctic Monkeys',
      5,
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