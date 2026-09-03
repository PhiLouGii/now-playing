import type { RoundConfig } from '../types/game'

export const defaultRound: RoundConfig = {
  id: 'default',
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
}