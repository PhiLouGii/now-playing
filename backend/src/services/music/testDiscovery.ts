import { discoverTracks } from './musicDiscoveryService.js'

async function main() {
  const tracks = await discoverTracks(1)

  console.log('\nTRACK OBJECT:\n')

  console.log(
    JSON.stringify(
      tracks[0],
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(
    'Discovery test failed:',
    error,
  )

  process.exit(1)
})