export type QuestionType =
  | 'name-the-song'
  | 'name-the-artist'
  | 'name-the-album'
  | 'guess-the-year'

export type QuestionDifficulty =
  | 'easy'
  | 'medium'
  | 'hard'

export type GeneratedSong = {
  id: string
  title: string
  artist: string
  album: string
  releaseYear: number
  artworkUrl: string
  audioUrl?: string
  genres: string[]
  provider?: string
  providerId?: string
}

export type GeneratedQuestion = {
  id: string
  type: QuestionType
  song: GeneratedSong
  answers: string[]
  correctAnswer: string
  difficulty: QuestionDifficulty
}