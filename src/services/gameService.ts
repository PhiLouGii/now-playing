import type {
  Question,
  RoundConfig,
} from '../types/game'

const API_URL = 'http://localhost:3000/api'

type GeneratedQuestionResponse = {
  question: Question
}

async function fetchQuestion(
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
  const questions: Question[] = []

  for (
    let index = 0;
    index < roundConfig.questionCount;
    index++
  ) {
    const type =
      roundConfig.questionTypes[
        index %
          roundConfig.questionTypes.length
      ]

    const question =
      await fetchQuestion(
        type,
        roundConfig.difficulty,
      )

    questions.push(question)
  }

  return questions
}