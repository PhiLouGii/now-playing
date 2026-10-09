import type {
  Question,
  RoundConfig,
  Song,
} from '../types/game'


type GeneratedQuestionResponse = {
  question: Question
}


const API_URL =
  'http://localhost:3000/api'


/*
 * =========================================================
 * TYPES
 * =========================================================
 */

export type EraKey =
  | '1960s'
  | '1970s'
  | '1980s'
  | '1990s'
  | '2000s'
  | '2010s'
  | '2020s'


export type GenreKey =
  | 'pop'
  | 'hip-hop'
  | 'r&b'
  | 'rock'
  | 'latin'
  | 'k-pop'
  | 'country'
  | 'reggae'
  | 'afrobeats'


export type ThemeKey =
  | 'the-breakup-department'
  | 'wish-you-were-here'
  | 'summer-nights'
  | 'main-character-energy'
  | 'bitter-and-better'
  | 'hits'
  | 'move-your-body'
  | 'oops-i-like-you'


export type LoadingFact = {
  fact: string
}


/*
 * =========================================================
 * GENERAL QUESTION GENERATION
 * =========================================================
 */

export async function generateQuestion(
  type: Question['type'],
  difficulty: Question['difficulty'],
  decade?: number,
  excludedTrackIds: string[] = [],
  categoryId?: string,
  artist?: string,
  artistId?: string,
  theme?: ThemeKey,
): Promise<Question> {
  const params =
    new URLSearchParams()

  params.set(
    'type',
    type,
  )

  params.set(
    'difficulty',
    difficulty,
  )

  if (
    decade !== undefined
  ) {
    params.set(
      'decade',
      String(decade),
    )
  }

  if (
    categoryId
  ) {
    params.set(
      'category',
      categoryId,
    )
  }

  if (
    artist
  ) {
    params.set(
      'artist',
      artist,
    )
  }

  if (
    artistId
  ) {
    params.set(
      'artistId',
      artistId,
    )
  }

  if (
    theme
  ) {
    params.set(
      'theme',
      theme,
    )
  }

  if (
    excludedTrackIds.length > 0
  ) {
    params.set(
      'exclude',
      excludedTrackIds.join(','),
    )
  }

  const response =
    await fetch(
      `${API_URL}/game/question?${params.toString()}`,
    )

  if (
    !response.ok
  ) {
    const data =
      await response
        .json()
        .catch(
          () => null,
        )

    throw new Error(
      data?.error ||
      'Failed to generate question.',
    )
  }

  const data =
    await response.json() as
      GeneratedQuestionResponse

  return data.question
}


/*
 * =========================================================
 * STANDARD ROUND
 * =========================================================
 */

export async function generateRound(
  config: RoundConfig,
): Promise<Question[]> {
  const questions: Question[] = []

  const usedTrackIds: string[] = []

  for (
    let index = 0;
    index < config.questionCount;
    index++
  ) {
    const type =
      config.questionTypes[
        index %
        config.questionTypes.length
      ]

    const question =
      await generateQuestion(
        type,
        config.difficulty,
        config.decade,
        usedTrackIds,
        config.categoryId,
        config.artist,
        config.artistId,
        config.theme,
      )

    questions.push(
      question,
    )

    if (
      question.correctAnswer?.trackId
    ) {
      usedTrackIds.push(
        question.correctAnswer.trackId,
      )
    }
  }

  return questions
}


/*
 * =========================================================
 * ERA / DECADE
 * =========================================================
 */

export type EraSong = {
  id: string
  title: string
  artist: string
  album: string
  year: number | null
  era?: string
  genres?: string[]
  themes?: string[]
  provider: string
  providerSongId: string
  previewUrl?: string
  artworkUrl?: string
}


type EraSongsResponse = {
  era: string
  count: number
  songs: EraSong[]
  playableSongs: EraSong[]
}


export async function getEraSongs(
  era: EraKey,
): Promise<EraSongsResponse> {
  const response =
    await fetch(
      `${API_URL}/eras/${encodeURIComponent(era)}`,
    )

  if (
    !response.ok
  ) {
    const data =
      await response
        .json()
        .catch(
          () => null,
        )

    throw new Error(
      data?.error ||
      'Failed to fetch era songs.',
    )
  }

  return response.json()
}


function eraSongToSong(
  song: EraSong,
): Song {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    releaseYear:
      song.year ??
      undefined,
    previewUrl:
      song.previewUrl ?? '',
    artworkUrl:
      song.artworkUrl ?? '',
  }
}


function shuffle<T>(
  items: T[],
): T[] {
  return [...items].sort(
    () =>
      Math.random() - 0.5,
  )
}


function createEraQuestion(
  song: EraSong,
  allSongs: EraSong[],
  type: Question['type'],
): Question {
  const correctSong =
    eraSongToSong(song)

  const candidates =
    shuffle(
      allSongs.filter(
        candidate =>
          candidate.id !== song.id,
      ),
    ).slice(
      0,
      3,
    )

  const answers =
    shuffle([
      correctSong,
      ...candidates.map(
        eraSongToSong,
      ),
    ])

  return {
    type,
    correctAnswer: {
      trackId: correctSong.id,
      answer: correctSong.title,
    },
    answers: answers.map(
      answer => ({
        id: answer.id,
        label: answer.title,
      }),
    ),
    song: correctSong,
  }
}


export async function generateEraRound(
  era: EraKey,
  questionCount: number,
  questionTypes: Question['type'][],
): Promise<Question[]> {
  const data =
    await getEraSongs(
      era,
    )

  const playableSongs =
    data.playableSongs

  if (
    playableSongs.length === 0
  ) {
    throw new Error(
      `No playable songs found for ${era}.`,
    )
  }

  const shuffled =
    shuffle(
      playableSongs,
    )

  const questions: Question[] = []

  for (
    let index = 0;
    index < questionCount;
    index++
  ) {
    const song =
      shuffled[
        index %
        shuffled.length
      ]

    const type =
      questionTypes[
        index %
        questionTypes.length
      ]

    questions.push(
      createEraQuestion(
        song,
        playableSongs,
        type,
      ),
    )
  }

  return questions
}


/*
 * =========================================================
 * GENRE
 * =========================================================
 */

export type GenreSong = {
  id: string
  title: string
  artist: string
  album: string
  year: number | null
  era?: string
  genres?: string[]
  themes?: string[]
  provider: string
  providerSongId: string
  previewUrl?: string
  artworkUrl?: string
}


type GenreSongsResponse = {
  genre: string
  count: number
  songs: GenreSong[]
  playableSongs: GenreSong[]
}


export async function getGenreSongs(
  genre: GenreKey,
): Promise<GenreSongsResponse> {
  const response =
    await fetch(
      `${API_URL}/genres/${encodeURIComponent(genre)}`,
    )

  if (
    !response.ok
  ) {
    const data =
      await response
        .json()
        .catch(
          () => null,
        )

    throw new Error(
      data?.error ||
      'Failed to fetch genre songs.',
    )
  }

  return response.json()
}


function genreSongToSong(
  song: GenreSong,
): Song {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    releaseYear:
      song.year ??
      undefined,
    previewUrl:
      song.previewUrl ?? '',
    artworkUrl:
      song.artworkUrl ?? '',
  }
}


function createGenreQuestion(
  song: GenreSong,
  allSongs: GenreSong[],
  type: Question['type'],
): Question {
  const correctSong =
    genreSongToSong(song)

  const candidates =
    shuffle(
      allSongs.filter(
        candidate =>
          candidate.id !== song.id,
      ),
    ).slice(
      0,
      3,
    )

  const answers =
    shuffle([
      correctSong,
      ...candidates.map(
        genreSongToSong,
      ),
    ])

  return {
    type,
    correctAnswer: {
      trackId: correctSong.id,
      answer: correctSong.title,
    },
    answers: answers.map(
      answer => ({
        id: answer.id,
        label: answer.title,
      }),
    ),
    song: correctSong,
  }
}


export async function generateGenreRound(
  genre: GenreKey,
  questionCount: number,
  questionTypes: Question['type'][],
): Promise<Question[]> {
  const data =
    await getGenreSongs(
      genre,
    )

  const playableSongs =
    data.playableSongs

  if (
    playableSongs.length === 0
  ) {
    throw new Error(
      `No playable songs found for ${genre}.`,
    )
  }

  const shuffled =
    shuffle(
      playableSongs,
    )

  const questions: Question[] = []

  for (
    let index = 0;
    index < questionCount;
    index++
  ) {
    const song =
      shuffled[
        index %
        shuffled.length
      ]

    const type =
      questionTypes[
        index %
        questionTypes.length
      ]

    questions.push(
      createGenreQuestion(
        song,
        playableSongs,
        type,
      ),
    )
  }

  return questions
}


/*
 * =========================================================
 * THEME
 * =========================================================
 *
 * Themes use the normal game-question endpoint, but with
 * an additional theme filter.
 *
 * This means the backend is responsible for:
 *
 *   Firestore theme filter
 *        ↓
 *   Deezer preview hydration
 *        ↓
 *   question generation
 */

export async function generateThemeRound(
  theme: ThemeKey,
  questionCount: number,
  questionTypes: Question['type'][],
  difficulty: Question['difficulty'],
): Promise<Question[]> {
  const questions: Question[] = []

  const usedTrackIds: string[] = []

  for (
    let index = 0;
    index < questionCount;
    index++
  ) {
    const type =
      questionTypes[
        index %
        questionTypes.length
      ]

    const question =
      await generateQuestion(
        type,
        difficulty,
        undefined,
        usedTrackIds,
        undefined,
        undefined,
        undefined,
        theme,
      )

    questions.push(
      question,
    )

    if (
      question.correctAnswer?.trackId
    ) {
      usedTrackIds.push(
        question.correctAnswer.trackId,
      )
    }
  }

  return questions
}


/*
 * =========================================================
 * LOADING FACTS
 * =========================================================
 */

export async function getLoadingFacts(
  count = 5,
): Promise<LoadingFact[]> {
  const response =
    await fetch(
      `${API_URL}/loading-facts?count=${count}`,
    )

  if (
    !response.ok
  ) {
    throw new Error(
      'Failed to fetch loading facts.',
    )
  }

  const data =
    await response.json()

  return data.facts ?? []
}