import type { Question } from '../types/game'

export const mockQuestions: Question[] = [
  {
    id: 'q1',
    song: {
      id: 'song1',
      title: 'Espresso',
      artist: 'Sabrina Carpenter',
      album: 'Short n’ Sweet',
      releaseYear: 2024,
      artworkUrl: '',
    },
    answers: [
      'Espresso',
      'Feather',
      'Please Please Please',
      'Nonsense',
    ],
    correctAnswer: 'Espresso',
  },

  {
    id: 'q2',
    song: {
      id: 'song2',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      releaseYear: 2020,
      artworkUrl: '',
    },
    answers: [
      'Save Your Tears',
      'Blinding Lights',
      'Starboy',
      'The Hills',
    ],
    correctAnswer: 'Blinding Lights',
  },

  {
    id: 'q3',
    song: {
      id: 'song3',
      title: 'Do I Wanna Know?',
      artist: 'Arctic Monkeys',
      album: 'AM',
      releaseYear: 2013,
      artworkUrl: '',
    },
    answers: [
      'R U Mine?',
      '505',
      'Do I Wanna Know?',
      'Why’d You Only Call Me When You’re High?',
    ],
    correctAnswer: 'Do I Wanna Know?',
  },

  {
    id: 'q4',
    song: {
      id: 'song4',
      title: 'Water',
      artist: 'Tyla',
      album: 'Tyla',
      releaseYear: 2023,
      artworkUrl: '',
    },
    answers: [
      'Truth or Dare',
      'Water',
      'Jump',
      'On and On',
    ],
    correctAnswer: 'Water',
  },

  {
    id: 'q5',
    song: {
      id: 'song5',
      title: 'Houdini',
      artist: 'Dua Lipa',
      album: 'Radical Optimism',
      releaseYear: 2024,
      artworkUrl: '',
    },
    answers: [
      'Houdini',
      'Training Season',
      'Levitating',
      'Dance The Night',
    ],
    correctAnswer: 'Houdini',
  },
]