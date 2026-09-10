import {
  getCandidatePool,
} from './musicCandidateService.js'

import {
  selectDistractors,
} from './distractorSelector.js'

import {
  deezerMusicProvider,
} from './deezerMusicProvider.js'

async function test() {
  const correctTrack =
    await deezerMusicProvider.getTrackById(
      'deezer-62724014',
    )

  if (!correctTrack) {
    throw new Error(
      'Could not find test track',
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
      'name-the-album',
      3,
    )

  console.log('\nCORRECT:')
  console.log(
    `${correctTrack.title} — ${correctTrack.artist} — ${correctTrack.album}`,
  )

  console.log('\nDISTRACTORS:')

  for (const distractor of distractors) {
    console.log(
      `${distractor.track.title} — ${distractor.track.artist} — ${distractor.track.album}`,
    )

    console.log(
      `  score: ${distractor.score}`,
    )

    console.log(
      `  source: ${distractor.source}`,
    )

    if (
      distractor.similarity !== undefined
    ) {
      console.log(
        `  similarity: ${distractor.similarity}`,
      )
    }
  }
}

test().catch((error) => {
  console.error(
    'Distractor selector test failed:',
    error,
  )

  process.exit(1)
})