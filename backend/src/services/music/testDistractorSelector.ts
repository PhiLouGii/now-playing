import { deezerMusicProvider } from './deezerMusicProvider.js'
import {
  getCandidatePool,
} from './musicCandidateService.js'
import {
  selectDistractors,
} from './distractorSelector.js'

async function test() {
  const results =
    await deezerMusicProvider.searchTracks(
      'Espresso Sabrina Carpenter',
      1,
    )

  const correctTrack =
    results[0]

  if (!correctTrack) {
    throw new Error(
      'Could not find Espresso',
    )
  }

  const candidates =
    await getCandidatePool(
      correctTrack,
    )

  const distractors =
    selectDistractors(
      candidates,
      correctTrack,
      3,
    )

  console.log(
    '\nCORRECT:',
  )

  console.log(
    `${correctTrack.title} — ${correctTrack.artist}`,
  )

  console.log(
    '\nDISTRACTORS:',
  )

  for (
    const distractor of distractors
  ) {
    console.log(
      `${distractor.track.title} — ${distractor.track.artist}`,
    )

    console.log(
      `  score: ${distractor.score.toFixed(2)}`,
    )

    console.log(
      `  source: ${distractor.source}`,
    )

    if (
      distractor.similarity !==
      undefined
    ) {
      console.log(
        `  similarity: ${distractor.similarity}`,
      )
    }

    console.log()
  }
}

test().catch((error) => {
  console.error(error)
  process.exit(1)
})