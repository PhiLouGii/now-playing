export type CategoryFranchise = {
  name: string
  albums: string[]
}

export const CATEGORY_FRANCHISES: Record<string, CategoryFranchise[]> = {
  'disney-nick': [
    {
      name: 'Hannah Montana',
      albums: [
        'Hannah Montana',
        'Hannah Montana The Movie',
        'Hannah Montana Forever',
      ],
    },

    {
      name: 'High School Musical',
      albums: [
        'High School Musical 3: Senior Year',
      ],
    },

    {
      name: 'Camp Rock',
      albums: [
        'Camp Rock 2: The Final Jam',
      ],
    },

    {
      name: 'The Cheetah Girls',
      albums: [
        'The Cheetah Girls (Original TV Movie Soundtrack)',
        'The Cheetah Girls 2',
        'The Cheetah Girls: One World',
      ],
    },

    {
      name: 'Teen Beach Movie',
      albums: [
        'Teen Beach Movie',
        'Teen Beach 2',
      ],
    },

    {
      name: 'Lemonade Mouth',
      albums: [
        'Lemonade Mouth',
      ],
    },

    {
      name: 'That’s So Raven',
      albums: [
        "Songs from That's So Raven",
      ],
    },

    {
      name: 'Zoey 101',
      albums: [
        'Follow Me (Zoey 101)',
      ],
    },
  ],
}
