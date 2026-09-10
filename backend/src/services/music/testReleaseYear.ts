import {
  deezerMusicProvider,
} from './deezerMusicProvider.js'

import {
  getReliableReleaseYear,
} from './releaseYearService.js'

async function test() {
  const track =
    await deezerMusicProvider.getTrackById(
      'deezer-1375215222',
    )

  if (!track) {
    throw new Error(
      'Could not find Dangerous Woman',
    )
  }

  console.log('\nTRACK:')
  console.log(
    `${track.title} — ${track.artist}`,
  )

  console.log('\nDEEZER YEAR:')
  console.log(track.releaseYear)

  console.log('\nISRC:')
  console.log(track.isrc)

  const reliableYear =
    await getReliableReleaseYear(
      track,
    )

  console.log('\nRELIABLE YEAR:')
  console.log(reliableYear)
}

test().catch((error) => {
  console.error(
    'Release year test failed:',
    error,
  )

  process.exit(1)
})