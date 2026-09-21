import { Check, X } from 'lucide-react'
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
        const isIncorrect =
          isAnswered &&
          isSelected &&
          !isCorrect

        let stateClass = ''

        if (isAnswered && isCorrect) {
          stateClass = 'game-answer--correct'
        } else if (isIncorrect) {
          stateClass = 'game-answer--incorrect'
        } else if (isSelected) {
          stateClass = 'game-answer--selected'
        }

        return (
          <button
            key={`${answer}-${index}`}
            type="button"
            className={`game-answer ${stateClass}`}
            onClick={() => onSelect(answer)}
            disabled={isAnswered}
          >
            <span className="game-answer__letter">
              {String.fromCharCode(65 + index)}
            </span>

            <span className="game-answer__text">
              {answer}
            </span>

            {isAnswered && isCorrect && (
              <Check
                className="game-answer__icon"
                size={17}
                strokeWidth={2.5}
              />
            )}

            {isIncorrect && (
              <X
                className="game-answer__icon"
                size={17}
                strokeWidth={2.5}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

export default AnswerGrid