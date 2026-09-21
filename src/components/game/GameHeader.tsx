import './GameHeader.css'

type GameHeaderProps = {
  currentQuestion: number
  totalQuestions: number
  score: number
}

function GameHeader({
  currentQuestion,
  totalQuestions,
  score,
}: GameHeaderProps) {
  return (
    <header className="game-header">
      <div className="game-header__item">
        <span className="game-header__label">
          ROUND
        </span>

        <strong className="game-header__value">
          {String(currentQuestion).padStart(2, '0')}
          <span className="game-header__separator">
            /
          </span>
          {String(totalQuestions).padStart(2, '0')}
        </strong>
      </div>

      <div className="game-header__item game-header__item--score">
        <span className="game-header__label">
          SCORE
        </span>

        <strong className="game-header__value">
          {score.toLocaleString()}
        </strong>
      </div>
    </header>
  )
}

export default GameHeader