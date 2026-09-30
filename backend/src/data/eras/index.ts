import { sixtiesSongs } from './sixties.js'
import { seventiesSongs } from './seventies.js'
import { eightiesSongs } from './eighties.js'

export const eraLibraries = {
  '1960s': sixtiesSongs,
  '1970s': seventiesSongs,
  '1980s': eightiesSongs
} as const

export type Era = keyof typeof eraLibraries