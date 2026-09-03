type GameHeaderProps = {
  currentQuestion: number
  totalQuestions: number
  score: number
}

import './GameHeader.css'

function GameHeader({
  currentQuestion,
  totalQuestions,
  score,
}: GameHeaderProps) {
  return (
    <header className="game-header">
      <div>
        <span className="game-header__label">
          ROUND
        </span>

        <strong>
          {String(currentQuestion).padStart(2, '0')} / {totalQuestions}
        </strong>
      </div>

      <div>
        <span className="game-header__label">
          SCORE
        </span>

        <strong>
          {score.toLocaleString()}
        </strong>
      </div>
    </header>
  )
}

export default GameHeader