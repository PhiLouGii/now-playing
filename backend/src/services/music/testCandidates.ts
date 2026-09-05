import { deezerMusicProvider } from './deezerMusicProvider.js'
import { getCandidatePool } from './musicCandidateService.js'

async function test() {
  const results =
    await deezerMusicProvider.searchTracks(
      'Espresso Sabrina Carpenter',
      1,
    )

  const correctTrack = results[0]

  if (!correctTrack) {
    throw new Error(
      'Could not find Espresso',
    )
  }

  const candidates =
    await getCandidatePool(
      correctTrack,
    )

  console.log(
    JSON.stringify(
      candidates,
      null,
      2,
    ),
  )
}

test().catch((error) => {
  console.error(error)
  process.exit(1)
})