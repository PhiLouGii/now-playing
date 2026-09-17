import {
  generateGameQuestion,
} from '../game/gameQuestionService.js'

async function main() {
  const question =
    await generateGameQuestion(
      'name-the-song',
      'medium',
      2020,
    )

  console.log(
    '\nQUESTION:\n',
  )

  console.log(
    `Correct song: ${question.song.title}`,
  )

  console.log(
    `Artist: ${question.song.artist}`,
  )

  console.log(
    `Release year: ${question.song.releaseYear}`,
  )

  console.log(
    '\nANSWERS:\n',
  )

  for (const answer of question.answers) {
    console.log(answer)
  }
}

main().catch((error) => {
  console.error(
    'Question generation test failed:',
    error,
  )

  process.exit(1)
})
