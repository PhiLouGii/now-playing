import type { MusicTrack } from './musicProvider.js'
import type {
  MusicCandidate,
  CandidateSource,
} from './musicCandidateService.js'

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

  /*
   * Candidate source strength.
   *
   * Same-album is strongest because the songs
   * share an explicit album relationship.
   *
   * Same-artist is also very believable.
   *
   * Similar tracks are useful for cross-artist
   * contextual distractors.
   */
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

  /*
   * Last.fm similarity is a useful signal,
   * but it should not completely dominate
   * the selection.
   */
  if (
    candidate.similarity !== undefined
  ) {
    score += candidate.similarity * 50
  }

  /*
   * Songs released around the same time are
   * generally more believable distractors.
   */
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

  /*
   * Add explicit relationship bonuses.
   */
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

function candidateKey(
  track: MusicTrack,
): string {
  return `${normalize(track.title)}::${artistKey(track)}`
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

function findBestCandidate(
  ranked: RankedDistractor[],
  predicate: (
    candidate: RankedDistractor,
  ) => boolean,
  selected: RankedDistractor[],
): RankedDistractor | undefined {
  return ranked.find(
    (candidate) =>
      !selected.some(
        (item) =>
          candidateKey(item.track) ===
          candidateKey(candidate.track),
      ) &&
      predicate(candidate),
  )
}

/**
 * Builds an answer set rather than simply
 * taking the three highest-scoring candidates.
 *
 * The goal is to make the three distractors
 * believable while keeping the artists varied.
 */
function selectWithComposition(
  ranked: RankedDistractor[],
  count: number,
  correctTrack: MusicTrack,
): RankedDistractor[] {
  const selected: RankedDistractor[] = []

  if (count <= 0) {
    return selected
  }

  /*
   * SLOT 1
   *
   * Prefer the strongest same-artist candidate.
   *
   * This gives the answer set a very believable
   * "you know this artist, but do you know this song?"
   * option.
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
    )

  if (sameArtistCandidate) {
    selected.push(
      sameArtistCandidate,
    )
  }

  /*
   * SLOT 2
   *
   * Prefer the strongest similar candidate
   * from another artist.
   *
   * This prevents all three distractors from
   * becoming songs by the correct artist.
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
      )

    if (crossArtistSimilar) {
      selected.push(
        crossArtistSimilar,
      )
    }
  }

  /*
   * SLOT 3+
   *
   * Prefer a completely new artist.
   *
   * We still respect candidate ranking,
   * so this is not random variety.
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
      )

    if (!newArtistCandidate) {
      break
    }

    selected.push(
      newArtistCandidate,
    )
  }

  /*
   * FALLBACK
   *
   * If the candidate pool doesn't contain
   * enough different artists, fill the remaining
   * slots using the best unused candidates.
   */
  while (selected.length < count) {
    const fallback =
      findBestCandidate(
        ranked,
        () => true,
        selected,
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
  )
}