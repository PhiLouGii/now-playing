import type {
  Question,
  QuestionType,
  Song,
} from '../types/game'

type GenerateQuestionOptions = {
  type?: QuestionType
  difficulty?: Question['difficulty']
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

  score += getGenreSimilarity(
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

function getWrongAnswers(
  correctSong: Song,
  songs: Song[],
  difficulty: Question['difficulty'],
  count = 3,
) {
  const candidates = songs.filter(
    (song) => song.id !== correctSong.id,
  )

  const scoredCandidates = candidates.map((song) => ({
    song,
    score: scoreDistractor(correctSong, song),
  }))

  if (difficulty === 'easy') {
    scoredCandidates.sort(
      (a, b) => b.score - a.score,
    )
  }

  if (difficulty === 'medium') {
    scoredCandidates.sort(
      (a, b) =>
        b.score - a.score + (Math.random() - 0.5) * 8,
    )
  }

  if (difficulty === 'hard') {
    scoredCandidates.sort(
      (a, b) =>
        a.score - b.score + (Math.random() - 0.5) * 8,
    )
  }

  return scoredCandidates
    .slice(0, count)
    .map((item) => item.song.title)
}

export function generateQuestion(
  song: Song,
  songs: Song[],
  options: GenerateQuestionOptions = {},
): Question {
  const type = options.type ?? 'name-the-song'
  const difficulty = options.difficulty ?? 'medium'

  if (type !== 'name-the-song') {
    throw new Error(
      `Unsupported question type: ${type}`,
    )
  }

  const wrongAnswers = getWrongAnswers(
    song,
    songs,
    difficulty,
  )

  const answers = shuffle([
    song.title,
    ...wrongAnswers,
  ])

  return {
    id: `${song.id}-${Date.now()}-${Math.random()}`,
    type,
    difficulty,
    song,
    answers,
    correctAnswer: song.title,
  }
}

export function generateGameQuestions(
  songs: Song[],
  questionCount = 5,
  options: GenerateQuestionOptions = {},
) {
  const shuffledSongs = shuffle(songs)

  const selectedSongs = shuffledSongs.slice(
    0,
    Math.min(questionCount, songs.length),
  )

  return selectedSongs.map((song) =>
    generateQuestion(song, songs, options),
  )
}