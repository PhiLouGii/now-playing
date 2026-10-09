import {
  theBreakupDepartmentSongs,
} from './theBreakupDepartment.js'
import {
  wishYouWereHereSongs,
} from './wishYouWereHere.js'
import {
  summerNightsSongs,
} from './summerNights.js'
import {
  bitterAndBetterSongs,
} from './bitterAndBetter.js'

export const themeLibraries = {
  'the-breakup-department':
    theBreakupDepartmentSongs,
  'wish-you-were-here':
    wishYouWereHereSongs,
  'summer-nights':
    summerNightsSongs,
  'bitter-and-better':
    bitterAndBetterSongs
} as const

export type Theme =
  keyof typeof themeLibraries