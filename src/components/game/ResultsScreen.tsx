import { useNavigate } from 'react-router-dom'
import './ResultsScreen.css'

type ResultsScreenProps = {
  score: number
  totalQuestions: number
  correctAnswers: number
  bestStreak: number
}

function ResultsScreen({
  score,
  totalQuestions,
  correctAnswers,
  bestStreak,
}: ResultsScreenProps) {
  const navigate = useNavigate()

  const accuracy =
    totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0

  function getResultMessage() {
    if (accuracy === 100) {
      return {
        label: 'PERFECT RUN.',
        description: 'You knew every track.',
      }
    }

    if (accuracy >= 80) {
      return {
        label: 'NICE RUN.',
        description: 'You really know your music.',
      }
    }

    if (accuracy >= 60) {
      return {
        label: 'SOLID WORK.',
        description: 'A few tracks got away from you.',
      }
    }

    return {
      label: 'GOOD TRY.',
      description: 'There is always another round.',
    }
  }

  const result = getResultMessage()

  function handlePlayAgain() {
    navigate('/game')
    window.location.reload()
  }

  function handleBackToPlay() {
    navigate('/play')
  }

  return (
    <main className="results-page">
      <div className="results-page__container">
        <div className="results-page__eyebrow">
          ROUND COMPLETE
        </div>

        <h1>GAME OVER</h1>

        <section className="results-score">
          <span className="results-score__label">
            FINAL SCORE
          </span>

          <strong>
            {score.toLocaleString()}
          </strong>
        </section>

        <p className="results-message">
          <strong>{result.label}</strong>
          <span>{result.description}</span>
        </p>

        <div className="results-stats">
          <div className="results-stat">
            <span>QUESTIONS</span>
            <strong>{totalQuestions}</strong>
          </div>

          <div className="results-stat">
            <span>CORRECT</span>
            <strong>{correctAnswers}</strong>
          </div>

          <div className="results-stat">
            <span>ACCURACY</span>
            <strong>{accuracy}%</strong>
          </div>

          <div className="results-stat">
            <span>BEST STREAK</span>
            <strong>{bestStreak}</strong>
          </div>
        </div>

        <div className="results-actions">
          <button
            type="button"
            className="results-actions__primary"
            onClick={handlePlayAgain}
          >
            PLAY AGAIN
          </button>

          <button
            type="button"
            className="results-actions__secondary"
            onClick={handleBackToPlay}
          >
            BACK TO PLAY
          </button>
        </div>
      </div>
    </main>
  )
}

export default ResultsScreen