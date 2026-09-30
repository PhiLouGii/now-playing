import { sixtiesSongs } from './sixties.js'
import { seventiesSongs } from './seventies.js'
import { eightiesSongs } from './eighties.js'
import { ninetiesSongs } from './nineties.js'
import { twoThousandsSongs } from './twothousands.js'

export const eraLibraries = {
  '1960s': sixtiesSongs,
  '1970s': seventiesSongs,
  '1980s': eightiesSongs,
  '1990s': ninetiesSongs,
  '2000s': twoThousandsSongs
} as const

export type Era = keyof typeof eraLibraries