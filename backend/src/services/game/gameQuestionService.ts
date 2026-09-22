import type {
QuestionDifficulty,
QuestionType,
} from './gameTypes.js'

import {
discoverTracks,
} from '../music/musicDiscoveryService.js'

import {
generateQuestion,
} from './questionGenerationService.js'

import {
isPlayableMusicTrack,
} from '../music/musicTrackFilter.js'

import {
deezerMusicProvider,
} from '../music/deezerMusicProvider.js'

import type {
MusicTrack,
} from '../music/musicProvider.js'

import {
getReliableReleaseYear,
} from '../music/releaseYearService.js'

import {
getCategoryTracks,
} from '../category/categoryMusicService.js'

async function hydrateTrack(
track: MusicTrack,
): Promise<MusicTrack> {
try {
const detailedTrack =
await deezerMusicProvider.getTrackById(
track.id,
)


return detailedTrack ?? track


} catch {
return track
}
}

async function enrichReleaseYear(
track: MusicTrack,
): Promise<MusicTrack> {
const releaseYear =
await getReliableReleaseYear(
track,
)

return {
...track,
releaseYear,
}
}

function normalize(
value: string,
): string {
return value
.toLowerCase()
.replace(/[()[]{}]/g, ' ')
.replace(/\s+/g, ' ')
.trim()
}

async function getEligibleTracks(
type: QuestionType,
decade?: number,
excludedTrackIds: string[] = [],
): Promise<MusicTrack[]> {
const maxAttempts = 3

const excludedIds =
new Set(excludedTrackIds)

for (
let attempt = 1;
attempt <= maxAttempts;
attempt++
) {
const discoveredTracks =
await discoverTracks(
20,
decade,
)


let eligibleTracks =
  discoveredTracks
    .filter(
      isPlayableMusicTrack,
    )
    .filter(
      (track) =>
        !excludedIds.has(
          track.id,
        ),
    )

if (
  type !== 'guess-the-year'
) {
  if (
    eligibleTracks.length > 0
  ) {
    return eligibleTracks
  }
} else {
  eligibleTracks =
    await Promise.all(
      eligibleTracks.map(
        hydrateTrack,
      ),
    )

  eligibleTracks =
    await Promise.all(
      eligibleTracks.map(
        enrichReleaseYear,
      ),
    )

  eligibleTracks =
    eligibleTracks.filter(
      (track) =>
        track.releaseYear !==
        undefined,
    )

  if (
    eligibleTracks.length > 0
  ) {
    return eligibleTracks
  }
}

console.log(
  `No eligible tracks found for ${
    decade ?? 'any era'
  }. Retrying (${attempt}/${maxAttempts})...`,
)


}

return []
}

async function getEligibleArtistTracks(
artist: string,
type: QuestionType,
excludedTrackIds: string[] = [],
): Promise<MusicTrack[]> {
const excludedIds =
new Set(excludedTrackIds)

const normalizedArtist =
normalize(artist)

const maxAttempts = 3

for (
let attempt = 1;
attempt <= maxAttempts;
attempt++
) {
try {
const tracks =
await deezerMusicProvider.searchTracks(
artist,
40,
)


  let eligibleTracks =
    tracks
      .filter(
        isPlayableMusicTrack,
      )
      .filter(
        (track) =>
          normalize(track.artist) ===
          normalizedArtist,
      )
      .filter(
        (track) =>
          !excludedIds.has(
            track.id,
          ),
      )

  if (
    type === 'guess-the-year'
  ) {
    eligibleTracks =
      await Promise.all(
        eligibleTracks.map(
          hydrateTrack,
        ),
      )

    eligibleTracks =
      await Promise.all(
        eligibleTracks.map(
          enrichReleaseYear,
        ),
      )

    eligibleTracks =
      eligibleTracks.filter(
        (track) =>
          track.releaseYear !==
          undefined,
      )
  }

  if (
    eligibleTracks.length > 0
  ) {
    return eligibleTracks
  }
} catch (error) {
  console.error(
    `Failed to search Deezer for artist "${artist}":`,
    error,
  )
}

console.log(
  `No eligible tracks found for artist "${artist}". Retrying (${attempt}/${maxAttempts})...`,
)


}

return []
}

async function getEligibleCategoryTracks(
categoryId: string,
type: QuestionType,
excludedTrackIds: string[] = [],
): Promise<MusicTrack[]> {
if (type !== 'name-the-song') {
throw new Error(
'Category games only support the "name-the-song" question type.',
)
}

const excludedIds =
new Set(excludedTrackIds)

const maxAttempts = 3

for (
let attempt = 1;
attempt <= maxAttempts;
attempt++
) {
const tracks =
await getCategoryTracks(
categoryId,
{
questionType: 'name-the-song',
limit: 40,
excludedTrackIds:
excludedIds,
},
)


const playableTracks =
  tracks.filter(
    isPlayableMusicTrack,
  )

if (
  playableTracks.length > 0
) {
  return playableTracks
}

console.log(
  `No playable tracks found for category "${categoryId}". Retrying (${attempt}/${maxAttempts})...`,
)


}

return []
}

function pickRandomTrack(
tracks: MusicTrack[],
): MusicTrack {
const randomIndex =
Math.floor(
Math.random() *
tracks.length,
)

return tracks[randomIndex]
}

export async function generateGameQuestion(
type: QuestionType,
difficulty: QuestionDifficulty,
decade?: number,
excludedTrackIds: string[] = [],
categoryId?: string,
artist?: string,
) {
let eligibleTracks: MusicTrack[]

if (categoryId) {
eligibleTracks =
await getEligibleCategoryTracks(
categoryId,
type,
excludedTrackIds,
)
} else if (artist) {
eligibleTracks =
await getEligibleArtistTracks(
artist,
type,
excludedTrackIds,
)
} else {
eligibleTracks =
await getEligibleTracks(
type,
decade,
excludedTrackIds,
)
}

if (
eligibleTracks.length === 0
) {
if (artist) {
throw new Error(
`Could not find an eligible track for artist: ${artist}`,
)
}


if (categoryId) {
  throw new Error(
    `Could not find an eligible track for category: ${categoryId}`,
  )
}

throw new Error(
  `Could not find an eligible track for question type: ${type}`,
)


}

const correctTrack =
pickRandomTrack(
eligibleTracks,
)

return generateQuestion(
correctTrack,
type,
difficulty,
decade,
excludedTrackIds,
categoryId,
)
}
