import './AnswerGrid.css'

type AnswerGridProps = {
  answers: string[]
  selectedAnswer: string | null
  correctAnswer: string
  isAnswered: boolean
  onSelect: (answer: string) => void
}

function AnswerGrid({
  answers,
  selectedAnswer,
  correctAnswer,
  isAnswered,
  onSelect,
}: AnswerGridProps) {
  return (
    <div className="game-answers">
      {answers.map((answer, index) => {
        const isSelected = selectedAnswer === answer
        const isCorrect = answer === correctAnswer

        let stateClass = ''

        if (isAnswered && isCorrect) {
          stateClass = 'game-answer--correct'
        } else if (isAnswered && isSelected) {
          stateClass = 'game-answer--incorrect'
        } else if (isSelected) {
          stateClass = 'game-answer--selected'
        }

        return (
          <button
            key={answer}
            type="button"
            className={`game-answer ${stateClass}`}
            onClick={() => onSelect(answer)}
            disabled={isAnswered}
          >
            <span>
              {String.fromCharCode(65 + index)}
            </span>

            {answer}
          </button>
        )
      })}
    </div>
  )
}

export default AnswerGrid