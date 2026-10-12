
import { useNavigate } from 'react-router-dom'
import './ResultsScreen.css'

type RecognitionResult = {
  questionNumber: number
  title: string
  artist: string
  albumArt?: string
  listenDuration: number
  points: number
  correct: boolean
}

type ResultsScreenProps = {
  score: number
  totalQuestions: number
  correctAnswers: number
  bestStreak: number
  recognitionResults: RecognitionResult[]
}

function ResultsScreen({
  score,
  totalQuestions,
  correctAnswers,
  bestStreak,
  recognitionResults,
}: ResultsScreenProps) {
  const navigate = useNavigate()

  const accuracy =
    totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0

  const recognizedResults = recognitionResults.filter(
    (result) => result.correct,
  )

  const fastestRecognition =
    recognizedResults.length > 0
      ? Math.min(
          ...recognizedResults.map(
            (result) => result.listenDuration,
          ),
        )
      : 0

  const averageRecognition =
    recognizedResults.length > 0
      ? recognizedResults.reduce(
          (total, result) => total + result.listenDuration,
          0,
        ) / recognizedResults.length
      : 0

  function formatDuration(duration: number) {
    return `${duration.toFixed(1)}s`
  }

  function getPerformanceMessage() {
    if (recognizedResults.length === 0) {
      return {
        label: 'THE MUSIC WON.',
        description: 'Better luck on the next round.',
      }
    }

    if (averageRecognition <= 0.5 && accuracy >= 80) {
      return {
        label: 'INSTANT RECOGNITION.',
        description: 'You barely needed the intros.',
      }
    }

    if (averageRecognition <= 2 && accuracy >= 80) {
      return {
        label: 'THAT WAS FAST.',
        description: 'You really know your music.',
      }
    }

    if (accuracy >= 80) {
      return {
        label: 'YOU KNOW YOUR MUSIC.',
        description: 'You got the songs. Speed comes next.',
      }
    }

    if (averageRecognition <= 2) {
      return {
        label: 'QUICK ON THE DRAW.',
        description: 'You recognized them fast.',
      }
    }

    if (accuracy >= 60) {
      return {
        label: 'SOLID RUN.',
        description: 'A few tracks got away from you.',
      }
    }

    return {
      label: 'KEEP LISTENING.',
      description: 'There is always another round.',
    }
  }

  const performance = getPerformanceMessage()

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
        <header className="results-header">
          <span className="results-page__eyebrow">
            ROUND COMPLETE
          </span>

          <div className="results-performance">
            <h1>{performance.label}</h1>
            <p>{performance.description}</p>
          </div>
        </header>

        <section className="results-score">
          <div className="results-score__label">
            FINAL SCORE
          </div>

          <strong className="results-score__value">
            {score.toLocaleString()}
          </strong>

          <span className="results-score__unit">
            POINTS
          </span>
        </section>

        <section className="results-speed">
          <div className="results-speed__header">
            <div>
              <span className="results-section-label">
                RECOGNITION SPEED
              </span>

              <h2>HOW FAST DID YOU KNOW?</h2>
            </div>
          </div>

          <div className="results-speed__main">
            <div className="results-speed__average">
              <span>AVERAGE</span>

              <strong>
                {recognizedResults.length > 0
                  ? formatDuration(averageRecognition)
                  : '—'}
              </strong>
            </div>

            <div className="results-speed__line" />

            <div className="results-speed__fastest">
              <span>FASTEST</span>

              <strong>
                {recognizedResults.length > 0
                  ? formatDuration(fastestRecognition)
                  : '—'}
              </strong>
            </div>
          </div>
        </section>

        <section className="results-stats">
          <div className="results-stat">
            <span>RECOGNIZED</span>

            <strong>
              {correctAnswers}
              <small>/{totalQuestions}</small>
            </strong>
          </div>

          <div className="results-stat">
            <span>ACCURACY</span>
            <strong>{accuracy}%</strong>
          </div>

          <div className="results-stat">
            <span>BEST STREAK</span>
            <strong>{bestStreak}</strong>
          </div>

          <div className="results-stat">
            <span>SONGS PLAYED</span>
            <strong>{totalQuestions}</strong>
          </div>
        </section>

        <section className="results-breakdown">
          <div className="results-breakdown__header">
            <div>
              <span className="results-section-label">
                ROUND RECAP
              </span>

              <h2>SONG BREAKDOWN</h2>
            </div>

            <span className="results-breakdown__count">
              {recognitionResults.length} TRACKS
            </span>
          </div>

          <div className="results-breakdown__list">
            {recognitionResults.map((result) => (
              <div
                className={[
                  'results-breakdown__item',
                  result.correct
                    ? 'results-breakdown__item--correct'
                    : 'results-breakdown__item--incorrect',
                ].join(' ')}
                key={result.questionNumber}
              >
                <span className="results-breakdown__number">
                  {String(result.questionNumber).padStart(2, '0')}
                </span>

                <div className="results-breakdown__track">
                  {result.albumArt ? (
                    <img
                      className="results-breakdown__cover"
                      src={result.albumArt}
                      alt={`${result.title} by ${result.artist} album artwork`}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div
                      className="results-breakdown__cover results-breakdown__cover--empty"
                      aria-hidden="true"
                    />
                  )}

                  <div className="results-breakdown__song">
                    <strong>{result.title}</strong>
                    <span>{result.artist}</span>
                  </div>
                </div>

                <div className="results-breakdown__result">
                  {result.correct ? (
                    <>
                      <div className="results-breakdown__time">
                        {formatDuration(result.listenDuration)}
                      </div>

                      <div className="results-breakdown__points">
                        +{result.points.toLocaleString()}
                      </div>
                    </>
                  ) : (
                    <span className="results-breakdown__miss">
                      NOT RECOGNIZED
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="results-actions">
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
        </footer>
      </div>
    </main>
  )
}

export default ResultsScreen
