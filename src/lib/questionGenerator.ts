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

function getWrongAnswers(
  correctSong: Song,
  songs: Song[],
  count = 3,
) {
  const candidates = songs.filter(
    (song) => song.id !== correctSong.id,
  )

  const shuffledCandidates = shuffle(candidates)

  return shuffledCandidates
    .slice(0, count)
    .map((song) => song.title)
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

  const wrongAnswers = getWrongAnswers(song, songs)

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