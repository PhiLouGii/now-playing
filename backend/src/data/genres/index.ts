import { popSongs } from './pop.js'

export const genreLibraries = {
  pop: popSongs,
} as const

export type Genre = keyof typeof genreLibraries