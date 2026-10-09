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
import { moveYourBodySongs } from './moveYourBody.js'

export const themeLibraries = {
  'the-breakup-department':
    theBreakupDepartmentSongs,
  'wish-you-were-here':
    wishYouWereHereSongs,
  'summer-nights':
    summerNightsSongs,
  'bitter-and-better':
    bitterAndBetterSongs,
  'move-your-body':
    moveYourBodySongs
} as const

export type Theme =
  keyof typeof themeLibraries