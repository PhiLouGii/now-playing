import { sixtiesSongs } from './sixties.js'
import { seventiesSongs } from './seventies.js'

export const eraLibraries = {
  '1960s': sixtiesSongs,
  '1970s': seventiesSongs,
} as const

export type Era = keyof typeof eraLibraries