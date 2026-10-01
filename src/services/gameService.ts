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

/* =========================================================
   GENERAL GAME QUESTION
   ========================================================= */

export async function generateQuestion(
  type: Question['type'],
  difficulty: Question['difficulty'],
  decade?: number,
  excludedTrackIds: string[] = [],
  categoryId?: string,
  artist?: string,
  artistId?: string,
): Promise<Question> {
  const params =
    new URLSearchParams()

  params.set('type', type)
  params.set(
    'difficulty',
    difficulty,
  )

  if (decade !== undefined) {
    params.set(
      'decade',
      String(decade),
    )
  }

  if (categoryId) {
    params.set(
      'category',
      categoryId,
    )
  }

  if (artist) {
    params.set(
      'artist',
      artist,
    )
  }

  if (artistId) {
    params.set(
      'artistId',
      artistId,
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

  if (!response.ok) {
    let message =
      'Failed to generate game question'

    try {
      const data =
        (await response.json()) as {
          error?: string
        }

      if (data.error) {
        message = data.error
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message)
  }

  const data =
    (await response.json()) as GeneratedQuestionResponse

  return data.question
}

/* =========================================================
   GENERAL ROUND GENERATOR
   ========================================================= */

export async function generateRound(
  roundConfig: RoundConfig,
): Promise<Question[]> {
  const questionRequests =
    Array.from(
      {
        length:
          roundConfig.questionCount,
      },
      (_, index) => {
        const type =
          roundConfig.questionTypes[
            index %
              roundConfig.questionTypes.length
          ]

        return generateQuestion(
          type,
          roundConfig.difficulty,
          roundConfig.decade,
        )
      },
    )

  return Promise.all(
    questionRequests,
  )
}

/* =========================================================
   ERA TYPES
   ========================================================= */

export type EraKey =
  | '1960s'
  | '1970s'
  | '1980s'
  | '1990s'
  | '2000s'
  | '2010s'
  | '2020s'

export type EraSong = {
  id: string
  title: string
  artist: string
  album: string
  year: number
  era: string
  provider: string
  providerSongId: string
  previewUrl: string
  artworkUrl: string
}

export type EraSongsResponse = {
  era: string
  count: number
  songs: EraSong[]
}

/* =========================================================
   GET ERA SONGS
   ========================================================= */

export async function getEraSongs(
  era: EraKey,
): Promise<EraSongsResponse> {
  const response =
    await fetch(
      `${API_URL}/eras/${era}`,
    )

  if (!response.ok) {
    let message =
      `Failed to load ${era} songs`

    try {
      const data =
        (await response.json()) as {
          message?: string
        }

      if (data.message) {
        message = data.message
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message)
  }

  return response.json()
}

/* =========================================================
   GENRE TYPES
   ========================================================= */

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

export type GenreSong = {
  id: string
  title: string
  artist: string
  album: string
  year: number
  era?: string
  genres: string[]
  provider: string
  providerSongId: string
  previewUrl: string
  artworkUrl: string
}

export type GenreSongsResponse = {
  genre: string
  count: number
  songs: GenreSong[]
}

/* =========================================================
   GET GENRE SONGS
   ========================================================= */

export async function getGenreSongs(
  genre: GenreKey,
): Promise<GenreSongsResponse> {
  const response =
    await fetch(
      `${API_URL}/genres/${encodeURIComponent(genre)}`,
    )

  if (!response.ok) {
    let message =
      `Failed to load ${genre} songs`

    try {
      const data =
        (await response.json()) as {
          message?: string
        }

      if (data.message) {
        message = data.message
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message)
  }

  return response.json()
}

/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffle<T>(
  array: T[],
): T[] {
  const shuffled = [...array]

  for (
    let i =
      shuffled.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() *
          (i + 1),
      )

    ;[
      shuffled[i],
      shuffled[j],
    ] = [
      shuffled[j],
      shuffled[i],
    ]
  }

  return shuffled
}

/* =========================================================
   CONVERT ERA SONG TO NORMAL SONG
   ========================================================= */

function eraSongToSong(
  song: EraSong,
): Song {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    releaseYear: song.year,
    artworkUrl:
      song.artworkUrl,
    audioUrl:
      song.previewUrl,
    genres: [],
    provider:
      song.provider,
    providerId:
      song.providerSongId,
  }
}

/* =========================================================
   CONVERT GENRE SONG TO NORMAL SONG
   ========================================================= */

function genreSongToSong(
  song: GenreSong,
): Song {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    releaseYear: song.year,
    artworkUrl:
      song.artworkUrl,
    audioUrl:
      song.previewUrl,
    genres:
      song.genres,
    provider:
      song.provider,
    providerId:
      song.providerSongId,
  }
}

/* =========================================================
   CREATE ERA QUESTION
   ========================================================= */

function createEraQuestion(
  song: EraSong,
  allSongs: EraSong[],
  type: Question['type'],
  difficulty: Question['difficulty'],
): Question {
  const correctAnswer =
    type === 'name-the-song'
      ? song.title
      : type ===
          'name-the-artist'
        ? song.artist
        : type ===
            'name-the-album'
          ? song.album
          : String(song.year)

  let candidateAnswers: string[]

  switch (type) {
    case 'name-the-song':
      candidateAnswers =
        allSongs
          .filter(
            other =>
              other.id !==
              song.id,
          )
          .map(
            other =>
              other.title,
          )
      break

    case 'name-the-artist':
      candidateAnswers =
        allSongs
          .filter(
            other =>
              other.id !==
              song.id,
          )
          .map(
            other =>
              other.artist,
          )
      break

    case 'name-the-album':
      candidateAnswers =
        allSongs
          .filter(
            other =>
              other.id !==
              song.id,
          )
          .map(
            other =>
              other.album,
          )
      break

    case 'guess-the-year':
      candidateAnswers =
        allSongs
          .filter(
            other =>
              other.id !==
              song.id,
          )
          .map(
            other =>
              String(
                other.year,
              ),
          )
      break

    default:
      candidateAnswers = []
  }

  const uniqueAnswers =
    Array.from(
      new Set(
        candidateAnswers.filter(
          answer =>
            answer !==
            correctAnswer,
        ),
      ),
    )

  const distractors =
    shuffle(
      uniqueAnswers,
    ).slice(0, 3)

  return {
    id: `era-${song.id}-${type}`,

    type,

    song:
      eraSongToSong(song),

    answers: shuffle([
      correctAnswer,
      ...distractors,
    ]),

    correctAnswer,

    difficulty,
  }
}

/* =========================================================
   GENERATE ERA ROUND
   ========================================================= */

export async function generateEraRound(
  era: EraKey,
  questionCount: number,
  questionTypes: Question['type'][],
  difficulty: Question['difficulty'],
): Promise<Question[]> {
  const data =
    await getEraSongs(era)

  const selectedSongs =
    shuffle(
      data.songs,
    ).slice(
      0,
      Math.min(
        questionCount,
        data.songs.length,
      ),
    )

  return selectedSongs.map(
    (song, index) => {
      const type =
        questionTypes[
          index %
            questionTypes.length
        ]

      return createEraQuestion(
        song,
        data.songs,
        type,
        difficulty,
      )
    },
  )
}

/* =========================================================
   CREATE GENRE QUESTION
   ========================================================= */

function createGenreQuestion(
  song: GenreSong,
  allSongs: GenreSong[],
  type: Question['type'],
  difficulty: Question['difficulty'],
): Question {
  const correctAnswer =
    type === 'name-the-song'
      ? song.title
      : type ===
          'name-the-artist'
        ? song.artist
        : type ===
            'name-the-album'
          ? song.album
          : String(song.year)

  let candidateAnswers: string[]

  switch (type) {
    case 'name-the-song':
      candidateAnswers =
        allSongs
          .filter(
            other =>
              other.id !==
              song.id,
          )
          .map(
            other =>
              other.title,
          )
      break

    case 'name-the-artist':
      candidateAnswers =
        allSongs
          .filter(
            other =>
              other.id !==
              song.id,
          )
          .map(
            other =>
              other.artist,
          )
      break

    case 'name-the-album':
      candidateAnswers =
        allSongs
          .filter(
            other =>
              other.id !==
              song.id,
          )
          .map(
            other =>
              other.album,
          )
      break

    case 'guess-the-year':
      candidateAnswers =
        allSongs
          .filter(
            other =>
              other.id !==
              song.id,
          )
          .map(
            other =>
              String(
                other.year,
              ),
          )
      break

    default:
      candidateAnswers = []
  }

  const uniqueAnswers =
    Array.from(
      new Set(
        candidateAnswers.filter(
          answer =>
            answer !==
            correctAnswer,
        ),
      ),
    )

  const distractors =
    shuffle(
      uniqueAnswers,
    ).slice(0, 3)

  return {
    id: `genre-${song.id}-${type}`,

    type,

    song:
      genreSongToSong(song),

    answers: shuffle([
      correctAnswer,
      ...distractors,
    ]),

    correctAnswer,

    difficulty,
  }
}

/* =========================================================
   GENERATE GENRE ROUND
   ========================================================= */

export async function generateGenreRound(
  genre: GenreKey,
  questionCount: number,
  questionTypes: Question['type'][],
  difficulty: Question['difficulty'],
): Promise<Question[]> {
  const data =
    await getGenreSongs(genre)

  const selectedSongs =
    shuffle(
      data.songs,
    ).slice(
      0,
      Math.min(
        questionCount,
        data.songs.length,
      ),
    )

  return selectedSongs.map(
    (song, index) => {
      const type =
        questionTypes[
          index %
            questionTypes.length
        ]

      return createGenreQuestion(
        song,
        data.songs,
        type,
        difficulty,
      )
    },
  )
}

export type LoadingFact = {
  id: string
  text: string
  category: string
  relatedArtist?: string
  relatedSong?: string
  relatedAlbum?: string
  relatedGenre?: string
  relatedEra?: string
}

export type LoadingFactsResponse = {
  count: number
  facts: LoadingFact[]
}

export async function getLoadingFacts(): Promise<LoadingFactsResponse> {
  const response = await fetch(
    `${API_URL}/loading-facts`,
  )

  if (!response.ok) {
    let message =
      'Failed to load music facts'

    try {
      const data =
        (await response.json()) as {
          message?: string
        }

      if (data.message) {
        message = data.message
      }
    } catch {}

    throw new Error(message)
  }

  return response.json()
}