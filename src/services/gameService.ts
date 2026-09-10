import type {
  Question,
  RoundConfig,
} from '../types/game'

const API_URL = 'http://localhost:3000/api'

type GeneratedQuestionResponse = {
  question: Question
}

export async function generateQuestion(
  type: Question['type'],
  difficulty: Question['difficulty'],
): Promise<Question> {
  const response = await fetch(
    `${API_URL}/game/question?type=${encodeURIComponent(type)}&difficulty=${encodeURIComponent(difficulty)}`,
  )

  if (!response.ok) {
    throw new Error(
      'Failed to generate game question',
    )
  }

  const data =
    (await response.json()) as GeneratedQuestionResponse

  return data.question
}

export async function generateRound(
  roundConfig: RoundConfig,
): Promise<Question[]> {
  const questionRequests =
    Array.from(
      {
        length:
          roundConfig.questionCount,
      },
      (_, index) => {
        const type =
          roundConfig.questionTypes[
            index %
              roundConfig.questionTypes.length
          ]

        return generateQuestion(
          type,
          roundConfig.difficulty,
        )
      },
    )

  return Promise.all(
    questionRequests,
  )
}