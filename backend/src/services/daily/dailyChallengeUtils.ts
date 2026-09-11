import {
  DAILY_THEMES,
  DAILY_TWISTS,
} from './dailyChallengeThemes.js'

function dateToNumber(
  date: string,
): number {
  return date
    .split('-')
    .join('')
    .split('')
    .reduce(
      (total, digit) =>
        total + Number(digit),
      0,
    )
}

export function getDailyTheme(
  date: string,
) {
  const seed = dateToNumber(date)

  return DAILY_THEMES[
    seed % DAILY_THEMES.length
  ]
}

export function getDailyTwist(
  date: string,
) {
  const seed =
    dateToNumber(date) + 7

  return DAILY_TWISTS[
    seed % DAILY_TWISTS.length
  ]
}