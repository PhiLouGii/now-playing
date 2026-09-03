import type { RoundConfig } from '../types/game'

export const rounds: RoundConfig[] = [
  {
    id: 'name-that-song',
    name: 'Name That Song',
    questionCount: 5,
    questionTypes: [
      'name-the-song',
      'name-the-song',
      'name-the-song',
      'name-the-song',
      'name-the-song',
    ],
    difficulty: 'medium',
  },

  {
    id: 'artist-challenge',
    name: 'Artist Challenge',
    questionCount: 5,
    questionTypes: [
      'name-the-artist',
      'name-the-artist',
      'name-the-artist',
      'name-the-artist',
      'name-the-artist',
    ],
    difficulty: 'medium',
  },

  {
    id: 'album-challenge',
    name: 'Album Challenge',
    questionCount: 5,
    questionTypes: [
      'name-the-album',
      'name-the-album',
      'name-the-album',
      'name-the-album',
      'name-the-album',
    ],
    difficulty: 'medium',
  },

  {
    id: 'year-challenge',
    name: 'Guess The Year',
    questionCount: 5,
    questionTypes: [
      'guess-the-year',
      'guess-the-year',
      'guess-the-year',
      'guess-the-year',
      'guess-the-year',
    ],
    difficulty: 'medium',
  },

  {
    id: 'mixed-challenge',
    name: 'Mixed Challenge',
    questionCount: 5,
    questionTypes: [
      'name-the-song',
      'name-the-artist',
      'name-the-song',
      'guess-the-year',
      'name-the-album',
    ],
    difficulty: 'medium',
  },
]