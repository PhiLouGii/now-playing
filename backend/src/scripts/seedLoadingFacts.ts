import { db } from '../config/firebase.js'
import { loadingFacts } from '../data/loadingFacts.js'

async function seedLoadingFacts() {
  console.log('\nSeeding loading facts...')
  console.log(
    `Facts in source list: ${loadingFacts.length}\n`,
  )

  let added = 0

  for (const [index, fact] of loadingFacts.entries()) {
    try {
      const documentId =
        `fact_${String(index + 1).padStart(3, '0')}`

      await db
        .collection('loadingFacts')
        .doc(documentId)
        .set({
          text: fact.text,
          category: fact.category,

          ...(fact.relatedArtist && {
            relatedArtist:
              fact.relatedArtist,
          }),

          ...(fact.relatedSong && {
            relatedSong:
              fact.relatedSong,
          }),

          ...(fact.relatedAlbum && {
            relatedAlbum:
              fact.relatedAlbum,
          }),

          ...(fact.relatedGenre && {
            relatedGenre:
              fact.relatedGenre,
          }),

          ...(fact.relatedEra && {
            relatedEra:
              fact.relatedEra,
          }),

          createdAt: new Date(),
        })

      console.log(
        `  ADDED: ${documentId}`,
      )

      added++
    } catch (error) {
      console.error(
        `  ERROR: Failed to add fact ${index + 1}`,
        error,
      )
    }
  }

  console.log('\n==============================')
  console.log('Loading facts seeding complete.')
  console.log(`Added: ${added}`)
  console.log('==============================\n')
}

seedLoadingFacts()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error(
      'Loading facts seeding failed:',
      error,
    )

    process.exit(1)
  })