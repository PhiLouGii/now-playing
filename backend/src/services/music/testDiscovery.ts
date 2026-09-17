import { discoverTracks } from './musicDiscoveryService.js'

async function main() {
  const tracks =
    await discoverTracks(
      20,
      1990,
    )

  console.log(
    `\nFOUND ${tracks.length} TRACKS:\n`,
  )

  for (const track of tracks) {
    console.log(
      `${track.releaseYear} — ${track.title} — ${track.artist}`,
    )
  }
}

main().catch((error) => {
  console.error(
    'Discovery test failed:',
    error,
  )

  process.exit(1)
})