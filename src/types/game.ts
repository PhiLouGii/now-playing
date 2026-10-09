export type Song = {
  id: string
  title: string
  artist: string
  album: string
  releaseYear?: number
  artworkUrl: string
  audioUrl?: string
  genres: string[]
  provider?: string
  providerId?: string
}

export type QuestionType =
  | 'name-the-song'
  | 'name-the-artist'
  | 'name-the-album'
  | 'guess-the-year'

export type QuestionDifficulty =
  | 'easy'
  | 'medium'
  | 'hard'

export type Question = {
  id: string
  type: QuestionType
  song: Song
  answers: string[]
  correctAnswer: string
  difficulty: QuestionDifficulty
}

export type RoundConfig = {
  id: string
  name: string
  questionCount: number
  questionTypes: QuestionType[]
  difficulty: QuestionDifficulty

  // Optional filters used by different game modes.
  genre?: string
  decade?: number
  theme?: string
  categoryId?: string
  artist?: string
  artistId?: string
}