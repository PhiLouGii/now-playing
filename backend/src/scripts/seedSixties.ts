import { db } from '../config/firebase.js'

import { deezerMusicProvider } from '../services/music/deezerMusicProvider.js'

import { sixtiesSongs } from '../data/eras/sixties.js'


async function seedSixties() {
  console.log('🎵 Starting 1960s seed...')
  console.log(`Songs to process: ${sixtiesSongs.length}`)

  let successful = 0
  let failed = 0

  for (const song of sixtiesSongs) {
    console.log(
      `\nSearching Deezer: ${song.artist} - ${song.title}`,
    )

    try {
      const results =
        await deezerMusicProvider.searchTracks(
          `${song.artist} ${song.title}`,
          10,
        )

      const match =
        results.find(
          track =>
            track.artist
              .toLowerCase()
              .includes(
                song.artist.toLowerCase(),
              ) &&
            track.title
              .toLowerCase()
              .includes(
                song.title.toLowerCase(),
              ),
        ) ??
        results[0]

      if (!match) {
        console.log(
          '❌ No Deezer match found',
        )

        failed += 1
        continue
      }

      if (!match.previewUrl) {
        console.log(
          '❌ Match found, but no preview available',
        )

        failed += 1
        continue
      }

      const documentId =
        `60s_${song.title
          .toLowerCase()
          .replace(
            /[^a-z0-9]+/g,
            '_',
          )
          .replace(
            /^_+|_+$/g,
            '',
          )}`

      await db
        .collection('songs')
        .doc(documentId)
        .set({
          title:
            song.title,

          artist:
            song.artist,

          album:
            match.album,

          year:
            song.year,

          era:
            '1960s',

          provider:
            'deezer',

          providerSongId:
            match.providerId,

          createdAt:
            new Date(),
        })

      console.log(
        `✅ Saved: ${song.title}`,
      )

      console.log(
        `   Deezer ID: ${match.providerId}`,
      )

      successful += 1
    } catch (error) {
      console.error(
        `❌ Failed: ${song.title}`,
        error,
      )

      failed += 1
    }
  }

  console.log('\n--------------------------------')
  console.log('1960s seed complete')
  console.log(`Successful: ${successful}`)
  console.log(`Failed: ${failed}`)
  console.log('--------------------------------')
}


seedSixties()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error(
      'Fatal seed error:',
      error,
    )

    process.exit(1)
  })