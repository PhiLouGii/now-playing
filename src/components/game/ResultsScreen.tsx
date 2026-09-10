import { useNavigate } from 'react-router-dom'
import './ResultsScreen.css'

type RecognitionResult = {
  questionNumber: number
  title: string
  artist: string
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
      ? Math.round(
          (correctAnswers /
            totalQuestions) *
            100,
        )
      : 0

  const recognizedResults =
    recognitionResults.filter(
      (result) => result.correct,
    )

  const fastestRecognition =
    recognizedResults.length > 0
      ? Math.min(
          ...recognizedResults.map(
            (result) =>
              result.listenDuration,
          ),
        )
      : 0

  const averageRecognition =
    recognizedResults.length > 0
      ? recognizedResults.reduce(
          (total, result) =>
            total +
            result.listenDuration,
          0,
        ) /
        recognizedResults.length
      : 0

  function formatDuration(
    duration: number,
  ) {
    return `${duration.toFixed(1)}s`
  }

  function getPerformanceMessage() {
    if (
      recognizedResults.length === 0
    ) {
      return {
        label: 'THE MUSIC WON.',
        description:
          'Better luck on the next round.',
      }
    }

    if (
      averageRecognition <= 0.5 &&
      accuracy >= 80
    ) {
      return {
        label:
          'INSTANT RECOGNITION.',
        description:
          'You barely needed the intros.',
      }
    }

    if (
      averageRecognition <= 2 &&
      accuracy >= 80
    ) {
      return {
        label: 'THAT WAS FAST.',
        description:
          'You really know your music.',
      }
    }

    if (accuracy >= 80) {
      return {
        label:
          'YOU KNOW YOUR MUSIC.',
        description:
          'You got the songs. Speed comes next.',
      }
    }

    if (
      averageRecognition <= 2
    ) {
      return {
        label: 'QUICK ON THE DRAW.',
        description:
          'You recognized them fast.',
      }
    }

    if (accuracy >= 60) {
      return {
        label: 'SOLID RUN.',
        description:
          'A few tracks got away from you.',
      }
    }

    return {
      label: 'KEEP LISTENING.',
      description:
        'There is always another round.',
    }
  }

  const performance =
    getPerformanceMessage()

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

        <section className="results-score">
          <span className="results-score__label">
            TOTAL SCORE
          </span>

          <strong>
            {score.toLocaleString()}
          </strong>
        </section>

        <section className="results-performance">
          <h1>
            {performance.label}
          </h1>

          <p>
            {performance.description}
          </p>
        </section>

        <section className="results-highlight">
          <span>
            AVERAGE LISTEN TIME
          </span>

          <strong>
            {recognizedResults.length >
            0
              ? formatDuration(
                  averageRecognition,
                )
              : '—'}
          </strong>
        </section>

        <section className="results-stats">
          <div className="results-stat">
            <span>
              SONGS RECOGNIZED
            </span>

            <strong>
              {correctAnswers} /{' '}
              {totalQuestions}
            </strong>
          </div>

          <div className="results-stat">
            <span>
              FASTEST RECOGNITION
            </span>

            <strong>
              {recognizedResults.length >
              0
                ? formatDuration(
                    fastestRecognition,
                  )
                : '—'}
            </strong>
          </div>

          <div className="results-stat">
            <span>
              BEST STREAK
            </span>

            <strong>
              {bestStreak}
            </strong>
          </div>

          <div className="results-stat">
            <span>
              ACCURACY
            </span>

            <strong>
              {accuracy}%
            </strong>
          </div>
        </section>

        <section className="results-breakdown">
          <div className="results-breakdown__header">
            <h2>
              RECOGNITION BREAKDOWN
            </h2>
          </div>

          <div className="results-breakdown__list">
            {recognitionResults.map(
              (result) => (
                <div
                  className={`results-breakdown__item ${
                    result.correct
                      ? 'results-breakdown__item--correct'
                      : 'results-breakdown__item--incorrect'
                  }`}
                  key={
                    result.questionNumber
                  }
                >
                  <span className="results-breakdown__number">
                    {String(
                      result.questionNumber,
                    ).padStart(2, '0')}
                  </span>

                  <div className="results-breakdown__song">
                    <strong>
                      {result.title}
                    </strong>

                    <span>
                      {result.artist}
                    </span>
                  </div>

                  <div className="results-breakdown__time">
                    <strong>
                      {formatDuration(
                        result.listenDuration,
                      )}
                    </strong>

                    <span>
                      {result.correct
                        ? `${result.points.toLocaleString()} PTS`
                        : 'NOT RECOGNIZED'}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        <div className="results-actions">
          <button
            type="button"
            className="results-actions__primary"
            onClick={
              handlePlayAgain
            }
          >
            PLAY AGAIN
          </button>

          <button
            type="button"
            className="results-actions__secondary"
            onClick={
              handleBackToPlay
            }
          >
            BACK TO PLAY
          </button>
        </div>
      </div>
    </main>
  )
}

export default ResultsScreen
