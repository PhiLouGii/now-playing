export type CategoryType =
  | 'genre'
  | 'group'
  | 'artist'
  | 'themed'

export type CategoryConfig = {
  id: string
  name: string
  description: string
  type: CategoryType
}

export const CATEGORY_CONFIG: CategoryConfig[] = [
  // ─────────────────────────────
  // GENRES
  // ─────────────────────────────

  {
    id: 'african',
    name: 'All Things African',
    description: 'Afrobeats · Amapiano · African Legends',
    type: 'genre',
  },

  {
    id: 'kpop',
    name: 'K-Pop',
    description: 'EXO · MONSTA X · GOT7',
    type: 'genre',
  },

  {
    id: 'indie-alt',
    name: 'Indie & Alt',
    description: 'Yeah Yeah Yeahs · Tame Impala · MGMT',
    type: 'genre',
  },

  // ─────────────────────────────
  // THEMES
  // ─────────────────────────────

  {
    id: 'disney-nick',
    name: 'Disney & Nick Throwbacks',
    description: 'Hannah Montana · iCarly · A.N.T. Farm',
    type: 'themed',
  },

  // ─────────────────────────────
  // GROUPS
  // ─────────────────────────────

  {
    id: 'girl-groups',
    name: 'Girl Groups',
    description: 'Spice Girls · Little Mix · Pussycat Dolls',
    type: 'group',
  },

  {
    id: 'boy-bands',
    name: 'Boy Bands',
    description: 'One Direction · NSYNC · Why Don’t We',
    type: 'group',
  },

  // ─────────────────────────────
  // ARTISTS
  // ─────────────────────────────

  {
    id: 'michael-jackson',
    name: 'Michael Jackson',
    description: 'The Jackson 5 · The Jacksons · Solo',
    type: 'artist',
  },

  {
    id: 'beyonce',
    name: 'Beyoncé',
    description: 'Destiny’s Child · Solo · The Carters',
    type: 'artist',
  },

  {
    id: 'queen',
    name: 'Queen',
    description: 'Classic hits · Deep cuts · Live',
    type: 'artist',
  },

  {
    id: 'ariana-grande',
    name: 'Ariana Grande',
    description: 'Early hits · Pop era · Sweetener',
    type: 'artist',
  },
]
