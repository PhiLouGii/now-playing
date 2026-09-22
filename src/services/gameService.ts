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
decade?: number,
excludedTrackIds: string[] = [],
categoryId?: string,
artist?: string,
): Promise<Question> {
const params = new URLSearchParams()

params.set('type', type)
params.set('difficulty', difficulty)

if (decade !== undefined) {
params.set(
'decade',
String(decade),
)
}

if (categoryId) {
params.set(
'category',
categoryId,
)
}

if (artist) {
params.set(
'artist',
artist,
)
}

if (
excludedTrackIds.length > 0
) {
params.set(
'exclude',
excludedTrackIds.join(','),
)
}

const response = await fetch(
`${API_URL}/game/question?${params.toString()}`,
)

if (!response.ok) {
let message =
'Failed to generate game question'

try {
  const data =
    (await response.json()) as {
      error?: string
    }

  if (data.error) {
    message = data.error
  }
} catch {
  // Keep the default error message.
}

throw new Error(message)


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
      roundConfig.decade,
    )
  },
)

return Promise.all(
questionRequests,
)
}
