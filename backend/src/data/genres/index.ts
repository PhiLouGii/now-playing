import { hipHopSongs } from './hipHop.js'
import { popSongs } from './pop.js'
import { rnbSongs } from './rnb.js'
import { rockSongs } from './rock.js'

export const genreLibraries = {
  pop: popSongs,
  'hip-hop': hipHopSongs,
  rnb: rnbSongs,
  rock: rockSongs
} as const

export type Genre = keyof typeof genreLibraries