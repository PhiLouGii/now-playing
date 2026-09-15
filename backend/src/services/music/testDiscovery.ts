import { discoverTracks } from './musicDiscoveryService.js'

async function main() {
  const tracks = await discoverTracks(20)

  console.log('\nDISCOVERED TRACKS:\n')

  for (const track of tracks) {
    console.log(
      `${track.artist} — ${track.title} (${track.releaseYear ?? 'unknown'})`,
    )
  }

  console.log(`\nTotal tracks: ${tracks.length}`)
}

main().catch((error) => {
  console.error('Discovery test failed:', error)
  process.exit(1)
})