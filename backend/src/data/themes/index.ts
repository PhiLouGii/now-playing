import {
  theBreakupDepartmentSongs,
} from './theBreakupDepartment.js'

export const themeLibraries = {
  'the-breakup-department':
    theBreakupDepartmentSongs,
} as const

export type Theme =
  keyof typeof themeLibraries