import type {
  DailyTheme,
  DailyTwist,
} from './dailyChallengeTypes.js'

export const DAILY_THEMES: DailyTheme[] = [
  {
    name: 'MAIN CHARACTER ENERGY',
    description:
      'Big songs. Bigger moments.',
  },
  {
    name: 'INDIE AFTER DARK',
    description:
      'For the people who know the late-night tracks.',
  },
  {
    name: '2000s THROWBACK',
    description:
      'You heard these songs everywhere.',
  },
  {
    name: 'POP GIRLS',
    description:
      'The voices. The hits. The drama.',
  },
  {
    name: 'GUILTY PLEASURES',
    description:
      'You definitely know this one.',
  },
  {
    name: 'THE VOCALS GIVE IT AWAY',
    description:
      'Recognize the voice before the hook.',
  },
  {
    name: 'MIDNIGHT DRIVE',
    description:
      'Songs for staring dramatically out the window.',
  },
  {
    name: 'CHAOTIC MIX',
    description:
      'No theme. No mercy. Good luck.',
  },
]

export const DAILY_TWISTS: DailyTwist[] = [
  {
    type: 'lightning',
    name: 'LIGHTNING',
    description:
      'Recognize it fast. Score big.',
  },
  {
    type: 'streak-rush',
    name: 'STREAK RUSH',
    description:
      'Keep the streak alive for massive bonuses.',
  },
  {
    type: 'deep-cut',
    name: 'DEEP CUT',
    description:
      'The obvious answer is rarely the answer.',
  },
  {
    type: 'mixed-bag',
    name: 'MIXED BAG',
    description:
      'Songs, artists, albums and years.',
  },
  {
    type: 'perfect-ten',
    name: 'PERFECT TEN',
    description:
      'Get all ten right for a huge bonus.',
  },
]