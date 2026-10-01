import { hipHopSongs } from './hipHop.js'
import { latinSongs } from './latin.js'
import { popSongs } from './pop.js'
import { rnbSongs } from './rnb.js'
import { rockSongs } from './rock.js'
import { kpopSongs } from './kpop.js'
import { countrySongs } from './country.js'
import { reggaeSongs } from './reggae.js'
import { afrobeatsSongs } from './afrobeats.js'

export const genreLibraries = {
  pop: popSongs,
  'hip-hop': hipHopSongs,
  rnb: rnbSongs,
  rock: rockSongs,
  latin: latinSongs,
  'k-pop': kpopSongs,
  country: countrySongs,
  reggae: reggaeSongs,
  afrobeats: afrobeatsSongs
} as const

export type Genre = keyof typeof genreLibraries