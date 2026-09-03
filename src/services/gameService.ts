import type {
  Question,
  RoundConfig,
} from '../types/game'
import { generateQuestion } from '../lib/questionGenerator'
import { getSongs } from './songService'

function shuffle<T>(items: T[]) {
  return [...items].sort(
    () => Math.random() - 0.5,
  )
}

export async function generateRound(
  roundConfig: RoundConfig,
): Promise<Question[]> {
  const songs = await getSongs()

  const shuffledSongs = shuffle(songs)

  const selectedSongs =
    shuffledSongs.slice(
      0,
      Math.min(
        roundConfig.questionCount,
        songs.length,
      ),
    )

  return selectedSongs.map(
    (song, index) => {
      const type =
        roundConfig.questionTypes[
          index %
            roundConfig.questionTypes.length
        ]

      return generateQuestion(
        song,
        songs,
        {
          type,
          difficulty:
            roundConfig.difficulty,
        },
      )
    },
  )
}