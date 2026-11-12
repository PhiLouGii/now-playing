import {
  seedCuratedPixelCoverAlbums,
  discoverPixelCoverAlbums,
} from '../services/pixelCoverService.js'

async function main() {
  try {
    const result = await seedCuratedPixelCoverAlbums()

    console.log('\nPixel Cover seed results:')
    console.log(`Saved: ${result.added}`)
    console.log(`Skipped: ${result.skipped}`)

    process.exit(0)
  } catch (error) {
    console.error('Pixel Cover seeding failed:', error)
    process.exit(1)
  }
}

main()
