export type Song = {
  id: string
  title: string
  artist: string
  album: string
  releaseYear: number
  artworkUrl: string
  audioUrl?: string
  genres: string[]
}

export type QuestionType =
  | 'name-the-song'

export type Question = {
  id: string
  type: QuestionType
  song: Song
  answers: string[]
  correctAnswer: string
  difficulty: 'easy' | 'medium' | 'hard'
}