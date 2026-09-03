export type Song = {
  id: string
  title: string
  artist: string
  album: string
  releaseYear: number
  artworkUrl: string
  audioUrl?: string
}

export type Question = {
  id: string
  song: Song
  answers: string[]
  correctAnswer: string
}