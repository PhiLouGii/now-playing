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

function normalizeArtistName(
value: string,
): string {
return value
.normalize('NFD')
.replace(
/[\u0300-\u036f]/g,
'',
)
.toLowerCase()
.replace(
/[()[]{}'’"`]/g,
' ',
)
.replace(
/[^a-z0-9]+/g,
' ',
)
.replace(
/\s+/g,
' ',
)
.trim()
}

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
      track =>
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
      track =>
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

async function getEligibleCategoryTracks(
categoryId: string,
type: QuestionType,
excludedTrackIds: string[] = [],
): Promise<MusicTrack[]> {
if (
type !== 'name-the-song'
) {
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
questionType:
'name-the-song',
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

/*

* PLAY BY ARTIST
*
* The selected artist is a SOURCE FILTER.
*
* Example:
*
* ```
  artist = "Rihanna"
  ```
* ```
  type   = "name-the-song"
  ```
*
* This means:
*
* ```
  Find Rihanna songs
  ```
* ```
  -> choose one
  ```
* ```
  -> ask the player to identify the song
  ```
*
* It does NOT mean:
*
* ```
  Find Rihanna songs
  ```
* ```
  -> ask the player to identify Rihanna
  ```

*/
async function getEligibleArtistTracks(
artist: string,
type: QuestionType,
excludedTrackIds: string[] = [],
): Promise<MusicTrack[]> {
if (
type !== 'name-the-song'
) {
throw new Error(
'Play by Artist only supports the "name-the-song" question type.',
)
}

const normalizedArtist =
normalizeArtistName(
artist,
)

const excludedIds =
new Set(excludedTrackIds)

try {
const artists =
await deezerMusicProvider.searchArtists(
artist,
10,
)


if (
  artists.length === 0
) {
  throw new Error(
    `Deezer returned no artist results for "${artist}".`,
  )
}

/*
 * Deezer can return multiple records
 * with the same artist name.
 *
 * Choose the main artist record by
 * fan count, then album count.
 */
const exactArtists =
  artists.filter(
    candidate =>
      normalizeArtistName(
        candidate.name ?? '',
      ) === normalizedArtist,
  )

if (
  exactArtists.length === 0
) {
  throw new Error(
    `Could not find an exact Deezer artist match for "${artist}".`,
  )
}

const selectedArtist =
  [...exactArtists].sort(
    (a, b) => {
      const fanDifference =
        (b.nb_fan ?? 0) -
        (a.nb_fan ?? 0)

      if (
        fanDifference !== 0
      ) {
        return fanDifference
      }

      return (
        (b.nb_album ?? 0) -
        (a.nb_album ?? 0)
      )
    },
  )[0]

console.log(
  `Selected Deezer artist "${selectedArtist.name}" (ID ${selectedArtist.id}) for "${artist}". Fans: ${selectedArtist.nb_fan ?? 0}, albums: ${selectedArtist.nb_album ?? 0}`,
)

/*
 * Start with the artist's top tracks.
 */
let tracks =
  await deezerMusicProvider.getArtistTopTracks(
    selectedArtist.id,
    50,
  )

/*
 * If we don't have enough usable songs,
 * expand into the artist's tracklist.
 */
const playableTopTracks =
  tracks.filter(
    isPlayableMusicTrack,
  )

if (
  playableTopTracks.length < 10 &&
  selectedArtist.tracklist
) {
  try {
    const tracklistTracks =
      await deezerMusicProvider.getArtistTracksByUrl(
        selectedArtist.tracklist,
        100,
      )

    tracks = [
      ...tracks,
      ...tracklistTracks,
    ]
  } catch (error) {
    console.warn(
      `Could not fetch full tracklist for "${artist}".`,
      error,
    )
  }
}

/*
 * Keep only actual songs by the selected artist.
 *
 * This prevents:
 *
 * Rihanna feat. someone
 * cover artists
 * unrelated Deezer results
 * remixes/live/etc.
 */
const eligibleTracks =
  tracks
    .filter(
      isPlayableMusicTrack,
    )
    .filter(
      track =>
        normalizeArtistName(
          track.artist,
        ) === normalizedArtist,
    )
    .filter(
      track =>
        !excludedIds.has(
          track.id,
        ),
    )

/*
 * Remove duplicate songs.
 */
const seen =
  new Set<string>()

const uniqueTracks =
  eligibleTracks.filter(
    track => {
      const key =
        `${normalizeArtistName(
          track.title,
        )}::${normalizeArtistName(
          track.artist,
        )}`

      if (
        seen.has(key)
      ) {
        return false
      }

      seen.add(key)

      return true
    },
  )

console.log(
  `Found ${uniqueTracks.length} playable tracks for artist "${artist}".`,
)

return uniqueTracks


} catch (error) {
console.error(
`Failed to fetch tracks for artist "${artist}":`,
error,
)


return []


}
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

/*

* CATEGORY FILTER
  */
  if (categoryId) {
  eligibleTracks =
  await getEligibleCategoryTracks(
  categoryId,
  type,
  excludedTrackIds,
  )
  }

/*

* ARTIST FILTER
*
* This is specifically for:
*
* ```
  Play -> Artist -> Rihanna
  ```
*
* The question type remains:
*
* ```
  name-the-song
  ```

*/
else if (artist) {
eligibleTracks =
await getEligibleArtistTracks(
artist,
type,
excludedTrackIds,
)
}

/*

* NORMAL GAME
*
* This preserves the existing behaviour
* of Guess the Artist, Guess the Album,
* Guess the Year, etc.
  */
  else {
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

/*

* Pick the actual song that the player
* will have to identify.
  */
  const correctTrack =
  pickRandomTrack(
  eligibleTracks,
  )

/*

* generateQuestion() handles the actual
* question and answer generation.
*
* Because type = "name-the-song":
*
* correctAnswer = song title
*
* distractors = other song titles
  */
return generateQuestion(
  correctTrack,
  type,
  difficulty,
  decade,
  excludedTrackIds,
  categoryId,
  artist
    ? eligibleTracks
    : undefined,
)
}
