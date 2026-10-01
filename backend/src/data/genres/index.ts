import { hipHopSongs } from './hipHop.js'
import { latinSongs } from './latin.js'
import { popSongs } from './pop.js'
import { rnbSongs } from './rnb.js'
import { rockSongs } from './rock.js'

export const genreLibraries = {
  pop: popSongs,
  'hip-hop': hipHopSongs,
  rnb: rnbSongs,
  rock: rockSongs,
  latin: latinSongs
} as const

export type Genre = keyof typeof genreLibraries