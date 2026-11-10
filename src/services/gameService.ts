import type {
  Question,
  QuestionDifficulty,
  QuestionType,
  RoundConfig,
  Song,
} from '../types/game'

const API_URL = 'http://localhost:3000/api'
const REQUEST_TIMEOUT_MS = 30_000
const ARTIST_REQUEST_TIMEOUT_MS = 120_000

/* =========================================================
   TYPES
   ========================================================= */

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
  | 'rnb'
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
  id?: string
  text?: string
  fact?: string
  category?: string
  relatedArtist?: string
  relatedSong?: string
  relatedAlbum?: string
  relatedGenre?: string
  relatedEra?: string
  [key: string]: unknown
}

export type ArtistSuggestion = {
  id: string
  name: string
  image: string
}

type CuratedSong = {
  id: string
  title: string
  artist: string
  album: string
  year: number | null
  era?: string
  genres?: string[]
  themes?: string[]
  provider?: string
  providerSongId?: string
  previewUrl?: string
  artworkUrl?: string
}

type ApiQuestionResponse = {
  question?: Question
  error?: string
  message?: string
}

type ApiSongsResponse = {
  songs?: CuratedSong[]
  tracks?: CuratedSong[]
  playableSongs?: CuratedSong[]
}

type ApiLoadingFactsResponse = {
  facts?: LoadingFact[]
  error?: string
  message?: string
}

type ApiArtistSearchResponse = {
  artists?: ArtistSuggestion[]
  error?: string
  message?: string
}

/* =========================================================
   API HELPERS
   ========================================================= */

async function fetchJson<T>(
  url: string,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController()

  const timeoutId = setTimeout(
    () => controller.abort(),
    timeoutMs,
  )

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    })

    if (!response.ok) {
      let message = `Request failed (${response.status})`

      try {
        const data = (await response.json()) as {
          error?: string
          message?: string
        }

        message = data.error ?? data.message ?? message
      } catch {
        // The server did not return a JSON error response.
      }

      throw new Error(message)
    }

    try {
      return (await response.json()) as T
    } catch {
      throw new Error('The server returned an invalid response.')
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }

    if (error instanceof TypeError) {
      throw new Error(
        'Unable to connect to the server. Check your connection and try again.',
      )
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/* =========================================================
   GENERAL HELPERS
   ========================================================= */

function shuffle<T>(items: T[]): T[] {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))

    ;[result[index], result[swapIndex]] = [
      result[swapIndex],
      result[index],
    ]
  }

  return result
}

function validateQuestionCount(questionCount: number): void {
  if (!Number.isInteger(questionCount) || questionCount < 1) {
    throw new Error('Question count must be a positive whole number.')
  }
}

function validateQuestionTypes(questionTypes: QuestionType[]): void {
  if (questionTypes.length === 0) {
    throw new Error('At least one question type is required.')
  }
}

/* =========================================================
   SONG HELPERS
   ========================================================= */

function answerFor(
  song: CuratedSong,
  type: QuestionType,
): string | null {
  switch (type) {
    case 'name-the-song':
      return song.title?.trim() || null

    case 'name-the-artist':
      return song.artist?.trim() || null

    case 'name-the-album':
      return song.album?.trim() || null

    case 'guess-the-year':
      return song.year == null ? null : String(song.year)

    default:
      return null
  }
}

function toSong(song: CuratedSong): Song {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    releaseYear: song.year ?? undefined,
    artworkUrl: song.artworkUrl ?? '',
    audioUrl: song.previewUrl ?? '',
    genres: song.genres ?? [],
    provider: song.provider,
    providerId: song.providerSongId ?? song.id,
  }
}

/* =========================================================
   CURATED QUESTION GENERATION
   ========================================================= */

function createCuratedQuestion(
  songs: CuratedSong[],
  correctSong: CuratedSong,
  type: QuestionType,
  difficulty: QuestionDifficulty,
): Question {
  const correctAnswer = answerFor(correctSong, type)

  if (!correctAnswer) {
    throw new Error(
      `Cannot create a ${type} question without a correct answer.`,
    )
  }

  const distractors: string[] = []
  const seenAnswers = new Set([correctAnswer])

  for (const song of shuffle(songs)) {
    if (song.id === correctSong.id) {
      continue
    }

    const answer = answerFor(song, type)

    if (!answer || seenAnswers.has(answer)) {
      continue
    }

    seenAnswers.add(answer)
    distractors.push(answer)

    if (distractors.length === 3) {
      break
    }
  }

  if (distractors.length < 3) {
    throw new Error(
      'Not enough distinct answers to create a question. Add more songs to this collection.',
    )
  }

  return {
    id: `question-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`,
    type,
    song: toSong(correctSong),
    answers: shuffle([correctAnswer, ...distractors]),
    correctAnswer,
    difficulty,
  }
}

async function fetchCuratedSongs(
  path: string,
): Promise<CuratedSong[]> {
  const data = await fetchJson<ApiSongsResponse>(
    `${API_URL}${path}`,
  )

  const songs =
    data.playableSongs ??
    data.songs ??
    data.tracks ??
    []

  return songs.filter(
    (song): song is CuratedSong =>
      Boolean(
        song &&
          typeof song.id === 'string' &&
          song.id.trim() &&
          typeof song.title === 'string' &&
          song.title.trim() &&
          typeof song.artist === 'string' &&
          song.artist.trim() &&
          typeof song.album === 'string' &&
          typeof song.previewUrl === 'string' &&
          song.previewUrl.trim(),
      ),
  )
}

async function generateCuratedRound(
  songs: CuratedSong[],
  questionCount: number,
  questionTypes: QuestionType[],
  difficulty: QuestionDifficulty,
): Promise<Question[]> {
  validateQuestionCount(questionCount)
  validateQuestionTypes(questionTypes)

  if (songs.length < 4) {
    throw new Error(
      'This collection needs at least four eligible songs to make a round.',
    )
  }

  const remaining = shuffle(songs)
  const questions: Question[] = []
  const usedTrackIds = new Set<string>()

  for (let index = 0; index < questionCount; index += 1) {
    const type = questionTypes[index % questionTypes.length]

    const correctIndex = remaining.findIndex(
      (song) =>
        !usedTrackIds.has(song.id) &&
        answerFor(song, type) !== null,
    )

    if (correctIndex === -1) {
      throw new Error(
        `Not enough unused songs with valid answers to complete this ${questionCount}-question round.`,
      )
    }

    const [correctSong] = remaining.splice(correctIndex, 1)

    const question = createCuratedQuestion(
      songs,
      correctSong,
      type,
      difficulty,
    )

    questions.push(question)
    usedTrackIds.add(correctSong.id)
  }

  return questions
}

/* =========================================================
   STANDARD QUESTIONS
   ========================================================= */

export async function generateQuestion(
  type: QuestionType,
  difficulty: QuestionDifficulty,
  decade?: number,
  excludedTrackIds: string[] = [],
  categoryId?: string,
  artist?: string,
  artistId?: string,
  theme?: string,
): Promise<Question> {
  const params = new URLSearchParams({
    type,
    difficulty,
  })

  if (decade !== undefined) {
    params.set('decade', String(decade))
  }

  if (excludedTrackIds.length > 0) {
    params.set('exclude', excludedTrackIds.join(','))
  }

  if (categoryId) {
    params.set('category', categoryId)
  }

  if (artist) {
    params.set('artist', artist)
  }

  if (artistId) {
    params.set('artistId', artistId)
  }

  if (theme) {
    params.set('theme', theme)
  }

  const timeoutMs = artist && artistId
  ? ARTIST_REQUEST_TIMEOUT_MS
  : REQUEST_TIMEOUT_MS

const data = await fetchJson<ApiQuestionResponse>(
  `${API_URL}/game/question?${params.toString()}`,
  timeoutMs,
)

  if (!data.question) {
    throw new Error(
      data.error ??
        data.message ??
        'The server did not return a question. Please try again.',
    )
  }

  return data.question
}

export async function generateRound(
  config: RoundConfig,
): Promise<Question[]> {
  validateQuestionCount(config.questionCount)
  validateQuestionTypes(config.questionTypes)

  const questions: Question[] = []
  const usedTrackIds: string[] = []

  for (
    let index = 0;
    index < config.questionCount;
    index += 1
  ) {
    const type =
      config.questionTypes[index % config.questionTypes.length]

    const question = await generateQuestion(
      type,
      config.difficulty,
      config.decade,
      usedTrackIds,
      config.categoryId,
      config.artist,
      config.artistId,
      config.theme,
    )

    questions.push(question)
    usedTrackIds.push(question.song.id)
  }

  return questions
}

/* =========================================================
   ERA QUESTIONS
   ========================================================= */

export async function getEraSongs(
  era: EraKey,
): Promise<CuratedSong[]> {
  return fetchCuratedSongs(
    `/eras/${encodeURIComponent(era)}`,
  )
}

export async function generateEraRound(
  era: EraKey,
  questionCount: number,
  questionTypes: QuestionType[],
  difficulty: QuestionDifficulty,
): Promise<Question[]> {
  const songs = await getEraSongs(era)

  return generateCuratedRound(
    songs,
    questionCount,
    questionTypes,
    difficulty,
  )
}

/* =========================================================
   GENRE QUESTIONS
   ========================================================= */

export async function getGenreSongs(
  genre: GenreKey,
): Promise<CuratedSong[]> {
  return fetchCuratedSongs(
    `/genres/${encodeURIComponent(genre)}`,
  )
}

export async function generateGenreRound(
  genre: GenreKey,
  questionCount: number,
  questionTypes: QuestionType[],
  difficulty: QuestionDifficulty,
): Promise<Question[]> {
  const songs = await getGenreSongs(genre)

  return generateCuratedRound(
    songs,
    questionCount,
    questionTypes,
    difficulty,
  )
}

/* =========================================================
   THEME QUESTIONS
   ========================================================= */

const THEME_RETRY_DELAYS = [400, 900] as const

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableThemeError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase() : ''

  const permanentErrors = [
    'not enough distinct answers',
    'needs at least',
    'unsupported question type',
    'invalid theme',
    'not found',
    'not enough unused songs',
  ]

  return !permanentErrors.some((phrase) =>
    message.includes(phrase),
  )
}

async function generateThemeQuestionWithRetry(
  theme: ThemeKey,
  type: QuestionType,
  difficulty: QuestionDifficulty,
  excludedTrackIds: string[],
): Promise<Question> {
  let lastError: unknown

  for (
    let attempt = 0;
    attempt <= THEME_RETRY_DELAYS.length;
    attempt += 1
  ) {
    try {
      return await generateQuestion(
        type,
        difficulty,
        undefined,
        excludedTrackIds,
        undefined,
        undefined,
        undefined,
        theme,
      )
    } catch (error) {
      lastError = error

      const hasAnotherAttempt =
        attempt < THEME_RETRY_DELAYS.length

      if (
        !hasAnotherAttempt ||
        !isRetryableThemeError(error)
      ) {
        break
      }

      await wait(THEME_RETRY_DELAYS[attempt])
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        'Unable to generate a question for this theme. Please try again.',
      )
}

export async function generateThemeRound(
  theme: ThemeKey,
  questionCount: number,
  questionTypes: QuestionType[],
  difficulty: QuestionDifficulty,
): Promise<Question[]> {
  validateQuestionCount(questionCount)
  validateQuestionTypes(questionTypes)

  if (
    questionTypes.some(
      (type) => type !== 'name-the-song',
    )
  ) {
    throw new Error(
      'Theme rounds currently support name-the-song questions only.',
    )
  }

  const questions: Question[] = []
  const usedTrackIds: string[] = []

  for (
    let index = 0;
    index < questionCount;
    index += 1
  ) {
    const type =
      questionTypes[index % questionTypes.length]

    const question = await generateThemeQuestionWithRetry(
      theme,
      type,
      difficulty,
      usedTrackIds,
    )

    questions.push(question)
    usedTrackIds.push(question.song.id)
  }

  return questions
}

/* =========================================================
   LOADING FACTS
   ========================================================= */

export async function getLoadingFacts(
  count = 5,
): Promise<LoadingFact[]> {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(
      'Loading fact count must be a positive whole number.',
    )
  }

  const params = new URLSearchParams({
    count: String(count),
  })

  const data = await fetchJson<ApiLoadingFactsResponse>(
    `${API_URL}/loading-facts?${params.toString()}`,
  )

  if (!Array.isArray(data.facts)) {
    return []
  }

  return data.facts.filter(
    (fact): fact is LoadingFact =>
      Boolean(
        fact &&
          typeof fact === 'object' &&
          (
            typeof fact.text === 'string' ||
            typeof fact.fact === 'string'
          ),
      ),
  )
}

/* =========================================================
   ARTIST SEARCH
   ========================================================= */

export async function searchArtists(
  query: string,
): Promise<ArtistSuggestion[]> {
  const trimmedQuery = query.trim()

  if (trimmedQuery.length < 2) {
    return []
  }

  const params = new URLSearchParams({
    q: trimmedQuery,
  })

  const response = await fetchJson<ApiArtistSearchResponse>(
    `${API_URL}/game/artists/search?${params.toString()}`,
  )

  if (!Array.isArray(response.artists)) {
    return []
  }

  return response.artists.filter(
    (artist): artist is ArtistSuggestion =>
      Boolean(
        artist &&
          typeof artist.id === 'string' &&
          artist.id.trim() &&
          typeof artist.name === 'string' &&
          artist.name.trim(),
      ),
  )
}
