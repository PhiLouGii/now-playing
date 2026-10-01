import { hipHopSongs } from './hipHop.js'
import { popSongs } from './pop.js'

export const genreLibraries = {
  pop: popSongs,
  'hip-hop': hipHopSongs
} as const

export type Genre = keyof typeof genreLibraries