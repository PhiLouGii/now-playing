import type {
  Question,
  QuestionDifficulty,
  QuestionType,
  Song,
} from '../types/game'

type GenerateQuestionOptions = {
  type?: QuestionType
  difficulty?: QuestionDifficulty
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function getGenreSimilarity(
  correctSong: Song,
  candidate: Song,
) {
  return candidate.genres.filter((genre) =>
    correctSong.genres.includes(genre),
  ).length
}

function getYearDifference(
  correctSong: Song,
  candidate: Song,
) {
  return Math.abs(
    correctSong.releaseYear - candidate.releaseYear,
  )
}

function scoreDistractor(
  correctSong: Song,
  candidate: Song,
) {
  let score = 0

  if (candidate.artist === correctSong.artist) {
    score += 10
  }

  score +=
    getGenreSimilarity(
      correctSong,
      candidate,
    ) * 4

  const yearDifference = getYearDifference(
    correctSong,
    candidate,
  )

  if (yearDifference <= 2) {
    score += 5
  } else if (yearDifference <= 5) {
    score += 3
  } else if (yearDifference <= 10) {
    score += 1
  }

  return score
}

function getSimilarSongs(
  correctSong: Song,
  songs: Song[],
  difficulty: QuestionDifficulty,
  count = 3,
) {
  const candidates = songs.filter(
    (song) => song.id !== correctSong.id,
  )

  const scoredCandidates = candidates.map((song) => ({
    song,
    score: scoreDistractor(
      correctSong,
      song,
    ),
  }))

  if (difficulty === 'easy') {
    scoredCandidates.sort(
      (a, b) => b.score - a.score,
    )
  }

  if (difficulty === 'medium') {
    scoredCandidates.sort(
      (a, b) =>
        b.score -
        a.score +
        (Math.random() - 0.5) * 8,
    )
  }

  if (difficulty === 'hard') {
    scoredCandidates.sort(
      (a, b) =>
        a.score -
        b.score +
        (Math.random() - 0.5) * 8,
    )
  }

  return scoredCandidates
    .slice(0, count)
    .map((item) => item.song)
}

function generateSongAnswers(
  song: Song,
  songs: Song[],
  difficulty: QuestionDifficulty,
) {
  const distractors = getSimilarSongs(
    song,
    songs,
    difficulty,
  )

  return shuffle([
    song.title,
    ...distractors.map(
      (distractor) => distractor.title,
    ),
  ])
}

function generateArtistAnswers(
  song: Song,
  songs: Song[],
  difficulty: QuestionDifficulty,
) {
  const candidates = songs
    .filter(
      (candidate) =>
        candidate.artist !== song.artist,
    )

  const distractors = getSimilarSongs(
    song,
    candidates,
    difficulty,
  )

  const uniqueArtists = Array.from(
    new Set(
      distractors.map(
        (distractor) => distractor.artist,
      ),
    ),
  )

  return shuffle([
    song.artist,
    ...uniqueArtists.slice(0, 3),
  ])
}

function generateAlbumAnswers(
  song: Song,
  songs: Song[],
  difficulty: QuestionDifficulty,
) {
  const candidates = songs.filter(
    (candidate) =>
      candidate.album !== song.album,
  )

  const distractors = getSimilarSongs(
    song,
    candidates,
    difficulty,
  )

  const uniqueAlbums = Array.from(
    new Set(
      distractors.map(
        (distractor) => distractor.album,
      ),
    ),
  )

  return shuffle([
    song.album,
    ...uniqueAlbums.slice(0, 3),
  ])
}

function generateYearAnswers(
  song: Song,
  songs: Song[],
  difficulty: QuestionDifficulty,
) {
  const candidates = songs.filter(
    (candidate) =>
      candidate.releaseYear !==
      song.releaseYear,
  )

  const distractors = getSimilarSongs(
    song,
    candidates,
    difficulty,
  )

  const uniqueYears = Array.from(
    new Set(
      distractors.map(
        (distractor) =>
          distractor.releaseYear,
      ),
    ),
  )

  return shuffle([
    song.releaseYear,
    ...uniqueYears.slice(0, 3),
  ].map(String))
}

function getQuestionAnswers(
  song: Song,
  songs: Song[],
  type: QuestionType,
  difficulty: QuestionDifficulty,
) {
  switch (type) {
    case 'name-the-song':
      return generateSongAnswers(
        song,
        songs,
        difficulty,
      )

    case 'name-the-artist':
      return generateArtistAnswers(
        song,
        songs,
        difficulty,
      )

    case 'name-the-album':
      return generateAlbumAnswers(
        song,
        songs,
        difficulty,
      )

    case 'guess-the-year':
      return generateYearAnswers(
        song,
        songs,
        difficulty,
      )
  }
}

function getCorrectAnswer(
  song: Song,
  type: QuestionType,
) {
  switch (type) {
    case 'name-the-song':
      return song.title

    case 'name-the-artist':
      return song.artist

    case 'name-the-album':
      return song.album

    case 'guess-the-year':
      return String(song.releaseYear)
  }
}

export function generateQuestion(
  song: Song,
  songs: Song[],
  options: GenerateQuestionOptions = {},
): Question {
  const type =
    options.type ?? 'name-the-song'

  const difficulty =
    options.difficulty ?? 'medium'

  const answers = getQuestionAnswers(
    song,
    songs,
    type,
    difficulty,
  )

  return {
    id: `${song.id}-${Date.now()}-${Math.random()}`,
    type,
    difficulty,
    song,
    answers,
    correctAnswer: getCorrectAnswer(
      song,
      type,
    ),
  }
}

export function generateGameQuestions(
  songs: Song[],
  questionCount = 5,
  options: GenerateQuestionOptions = {},
) {
  const shuffledSongs = shuffle(songs)

  const selectedSongs =
    shuffledSongs.slice(
      0,
      Math.min(
        questionCount,
        songs.length,
      ),
    )

  return selectedSongs.map((song) =>
    generateQuestion(
      song,
      songs,
      options,
    ),
  )
}