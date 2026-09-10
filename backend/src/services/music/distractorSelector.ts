import type { MusicTrack } from './musicProvider.js'

import type {
  MusicCandidate,
  CandidateSource,
} from './musicCandidateService.js'

import type { QuestionType } from '../game/gameTypes.js'

export type RankedDistractor = {
  track: MusicTrack
  score: number
  source: CandidateSource
  similarity?: number
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sameArtist(
  candidate: MusicTrack,
  correctTrack: MusicTrack,
): boolean {
  return (
    normalize(candidate.artist) ===
    normalize(correctTrack.artist)
  )
}

function sameAlbum(
  candidate: MusicTrack,
  correctTrack: MusicTrack,
): boolean {
  return (
    normalize(candidate.artist) ===
      normalize(correctTrack.artist) &&
    normalize(candidate.album) ===
      normalize(correctTrack.album)
  )
}

function yearDifference(
  candidate: MusicTrack,
  correctTrack: MusicTrack,
): number | null {
  if (
    candidate.releaseYear === undefined ||
    correctTrack.releaseYear === undefined
  ) {
    return null
  }

  return Math.abs(
    candidate.releaseYear -
      correctTrack.releaseYear,
  )
}

function calculateScore(
  candidate: MusicCandidate,
  correctTrack: MusicTrack,
): number {
  let score = 0

  if (
    candidate.source === 'same-album'
  ) {
    score += 55
  }

  if (
    candidate.source === 'same-artist'
  ) {
    score += 45
  }

  if (
    candidate.source === 'similar'
  ) {
    score += 20
  }

  if (
    candidate.similarity !== undefined
  ) {
    score += candidate.similarity * 50
  }

  const difference =
    yearDifference(
      candidate.track,
      correctTrack,
    )

  if (difference !== null) {
    if (difference <= 2) {
      score += 20
    } else if (difference <= 5) {
      score += 12
    } else if (difference <= 10) {
      score += 5
    }
  }

  if (
    sameArtist(
      candidate.track,
      correctTrack,
    )
  ) {
    score += 15
  }

  if (
    sameAlbum(
      candidate.track,
      correctTrack,
    )
  ) {
    score += 20
  }

  return score
}

function rankCandidates(
  candidates: MusicCandidate[],
  correctTrack: MusicTrack,
): RankedDistractor[] {
  return candidates
    .map((candidate) => ({
      track: candidate.track,
      source: candidate.source,
      similarity: candidate.similarity,
      score: calculateScore(
        candidate,
        correctTrack,
      ),
    }))
    .sort(
      (a, b) =>
        b.score - a.score,
    )
}

function artistKey(
  track: MusicTrack,
): string {
  return normalize(track.artist)
}

function trackKey(
  track: MusicTrack,
): string {
  return `${normalize(track.title)}::${artistKey(track)}`
}

function getAnswerValue(
  track: MusicTrack,
  type: QuestionType,
): string | null {
  switch (type) {
    case 'name-the-song':
      return normalize(track.title)

    case 'name-the-artist':
      return normalize(track.artist)

    case 'name-the-album':
      return normalize(track.album)

    case 'guess-the-year':
      return track.releaseYear !== undefined
        ? String(track.releaseYear)
        : null

    default:
      return null
  }
}

function isSameArtistAsAnySelected(
  candidate: RankedDistractor,
  selected: RankedDistractor[],
): boolean {
  return selected.some(
    (item) =>
      artistKey(item.track) ===
      artistKey(candidate.track),
  )
}

function hasAnswerValue(
  candidate: RankedDistractor,
  selected: RankedDistractor[],
  correctTrack: MusicTrack,
  type: QuestionType,
): boolean {
  const candidateAnswer =
    getAnswerValue(
      candidate.track,
      type,
    )

  if (candidateAnswer === null) {
    return true
  }

  const correctAnswer =
    getAnswerValue(
      correctTrack,
      type,
    )

  if (
    correctAnswer !== null &&
    candidateAnswer === correctAnswer
  ) {
    return true
  }

  return selected.some(
    (item) =>
      getAnswerValue(
        item.track,
        type,
      ) === candidateAnswer,
  )
}

function findBestCandidate(
  ranked: RankedDistractor[],
  predicate: (
    candidate: RankedDistractor,
  ) => boolean,
  selected: RankedDistractor[],
  correctTrack: MusicTrack,
  type: QuestionType,
): RankedDistractor | undefined {
  return ranked.find(
    (candidate) =>
      !selected.some(
        (item) =>
          trackKey(item.track) ===
          trackKey(candidate.track),
      ) &&
      !hasAnswerValue(
        candidate,
        selected,
        correctTrack,
        type,
      ) &&
      predicate(candidate),
  )
}

function selectWithComposition(
  ranked: RankedDistractor[],
  count: number,
  correctTrack: MusicTrack,
  type: QuestionType,
): RankedDistractor[] {
  const selected: RankedDistractor[] = []

  if (count <= 0) {
    return selected
  }

  /*
   * First preference:
   * keep one same-artist distractor when possible.
   *
   * This creates a believable option without
   * forcing every distractor to come from the
   * same artist.
   */
  const sameArtistCandidate =
    findBestCandidate(
      ranked,
      (candidate) =>
        sameArtist(
          candidate.track,
          correctTrack,
        ),
      selected,
      correctTrack,
      type,
    )

  if (sameArtistCandidate) {
    selected.push(
      sameArtistCandidate,
    )
  }

  /*
   * Second preference:
   * use a strong cross-artist similar track.
   */
  if (selected.length < count) {
    const crossArtistSimilar =
      findBestCandidate(
        ranked,
        (candidate) =>
          candidate.source ===
            'similar' &&
          !sameArtist(
            candidate.track,
            correctTrack,
          ) &&
          !isSameArtistAsAnySelected(
            candidate,
            selected,
          ),
        selected,
        correctTrack,
        type,
      )

    if (crossArtistSimilar) {
      selected.push(
        crossArtistSimilar,
      )
    }
  }

  /*
   * Continue looking for candidates from
   * artists that have not already been used.
   */
  while (selected.length < count) {
    const newArtistCandidate =
      findBestCandidate(
        ranked,
        (candidate) =>
          !isSameArtistAsAnySelected(
            candidate,
            selected,
          ),
        selected,
        correctTrack,
        type,
      )

    if (!newArtistCandidate) {
      break
    }

    selected.push(
      newArtistCandidate,
    )
  }

  /*
   * Final fallback:
   * allow an already-used artist if necessary,
   * but still require a completely unique answer.
   */
  while (selected.length < count) {
    const fallback =
      findBestCandidate(
        ranked,
        () => true,
        selected,
        correctTrack,
        type,
      )

    if (!fallback) {
      break
    }

    selected.push(fallback)
  }

  return selected
}

export function selectDistractors(
  candidates: MusicCandidate[],
  correctTrack: MusicTrack,
  type: QuestionType,
  count = 3,
): RankedDistractor[] {
  const ranked =
    rankCandidates(
      candidates,
      correctTrack,
    )

  return selectWithComposition(
    ranked,
    count,
    correctTrack,
    type,
  )
}