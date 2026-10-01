import { hipHopSongs } from './hipHop.js'
import { popSongs } from './pop.js'
import { rnbSongs } from './rnb.js'

export const genreLibraries = {
  pop: popSongs,
  'hip-hop': hipHopSongs,
  rnb: rnbSongs
} as const

export type Genre = keyof typeof genreLibraries