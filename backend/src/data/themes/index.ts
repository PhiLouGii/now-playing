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
import { oopsILikeYouSongs } from './oopsILikeYou.js'
import { secretsAndMistressesSongs } from './secretsAndMistresses.js'
import { thePeoplesPlaylistSongs } from './thePeoplesPlaylist.js'

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
    moveYourBodySongs,
  'oops-i-like-you':
    oopsILikeYouSongs,
  'secrets-and-mistresses':
    secretsAndMistressesSongs,
  'the-peoples-playlist':
    thePeoplesPlaylistSongs
} as const

export type Theme =
  keyof typeof themeLibraries