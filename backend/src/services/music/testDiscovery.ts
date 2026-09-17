import { deezerMusicProvider } from './deezerMusicProvider.js'

async function main() {
  console.time('total')

  console.log('\n1. Getting genres...')
  console.time('genres')

  const genres =
    await deezerMusicProvider.getGenres()

  console.timeEnd('genres')

  console.log(
    `Found ${genres.length} genres.`,
  )

  const genre =
    genres.find(
      (item) =>
        item.id !== 0,
    )

  if (!genre) {
    throw new Error(
      'No usable genre found',
    )
  }

  console.log(
    `\n2. Testing genre: ${genre.name} (${genre.id})`,
  )

  console.time('artists')

  const artists =
    await deezerMusicProvider.getGenreArtists(
      genre.id,
      5,
    )

  console.timeEnd('artists')

  console.log(
    `Found ${artists.length} artists.`,
  )

  const artist =
    artists.find(
      (item) => item.id,
    )

  if (!artist) {
    throw new Error(
      'No artist found',
    )
  }

  console.log(
    `\n3. Testing artist: ${artist.name} (${artist.id})`,
  )

  console.time('tracks')

  const tracks =
    await deezerMusicProvider.getArtistTopTracks(
      artist.id,
      5,
    )

  console.timeEnd('tracks')

  console.log(
    `Found ${tracks.length} tracks.`,
  )

  const track =
    tracks[0]

  if (!track) {
    throw new Error(
      'No track found',
    )
  }

  console.log(
    `\n4. Testing release-year enrichment:`,
  )

  console.log(
    `${track.title} — ${track.artist}`,
  )

  console.time('releaseYear')

  const detailed =
    await deezerMusicProvider.getTrackById(
      track.id,
    )

  console.timeEnd('releaseYear')

  console.log(
    '\nRESULT:',
  )

  console.log(
    JSON.stringify(
      detailed,
      null,
      2,
    ),
  )

  console.timeEnd('total')
}

main().catch((error) => {
  console.error(
    '\nTEST FAILED:',
    error,
  )

  process.exit(1)
})