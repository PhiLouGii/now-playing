import {
  useMemo,
} from 'react'

import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import type {
  QuestionType,
} from '../../types/game'

import './DailyChallengeResults.css'

type ConfettiPiece = {
  id: number
  left: number
  delay: number
  duration: number
  rotation: number
}

type QuestionResult = {
  questionId: string
  questionType: QuestionType
  songTitle: string
  artist: string
  album: string
  releaseYear?: number
  artworkUrl: string
  selectedAnswer: string | null
  correctAnswer: string
  isCorrect: boolean
  revealed: boolean
  listenDuration: number
  points: number
}

type DailyResultsState = {
  challenge: {
    theme: {
      name: string
      description: string
    }
    twist: {
      name: string
      description: string
    }
    questionCount: number
  }
  score: number
  correctAnswers: number
  bestStreak: number
  questionResults: QuestionResult[]
}

function getQuestionLabel(
  type: QuestionType,
): string {
  switch (type) {
    case 'name-the-song':
      return 'NAME THE SONG'

    case 'name-the-artist':
      return 'NAME THE ARTIST'

    case 'name-the-album':
      return 'NAME THE ALBUM'

    case 'guess-the-year':
      return 'GUESS THE YEAR'

    default:
      return 'QUESTION'
  }
}

function DailyChallengeResults() {
  const location = useLocation()
  const navigate = useNavigate()

  const state =
    location.state as
      | DailyResultsState
      | null

  const challenge = state?.challenge

  const questionResults =
    state?.questionResults ?? []

  const score =
    state?.score ?? 0

  const correctAnswers =
    state?.correctAnswers ?? 0

  const bestStreak =
    state?.bestStreak ?? 0

  const questionCount =
    challenge?.questionCount ??
    questionResults.length

  const accuracy =
    questionCount > 0
      ? Math.round(
          (correctAnswers /
            questionCount) *
            100,
        )
      : 0

  const totalListeningTime =
    useMemo(
      () =>
        questionResults.reduce(
          (
            total,
            result,
          ) =>
            total +
            result.listenDuration,
          0,
        ),
      [questionResults],
    )

  const celebrationLevel =
    accuracy >= 90
      ? 'full'
      : accuracy >= 70
        ? 'high'
        : accuracy >= 40
          ? 'subtle'
          : 'none'

  const confettiPieces =
    useMemo<ConfettiPiece[]>(() => {
      if (
        celebrationLevel ===
        'none'
      ) {
        return []
      }

      const count =
        celebrationLevel ===
        'full'
          ? 70
          : celebrationLevel ===
              'high'
            ? 45
            : 20

      return Array.from({
        length: count,
      }).map((_, index) => ({
        id: index,
        left:
          Math.random() * 100,
        delay:
          Math.random() * 2,
        duration:
          3 +
          Math.random() * 3,
        rotation:
          Math.random() * 360,
      }))
    }, [celebrationLevel])

  const resultMessage =
    accuracy === 100
      ? 'PERFECT RUN.'
      : accuracy >= 80
        ? 'YOU KNOW YOUR MUSIC.'
        : accuracy >= 60
          ? 'NOT BAD AT ALL.'
          : accuracy >= 40
            ? 'THE MUSIC FOUGHT BACK.'
            : 'ROUGH ONE. RUN IT BACK.'

  if (
    !state ||
    !challenge
  ) {
    return (
      <main className="daily-results">
        <div className="daily-results__error">
          <span>
            DAILY RESULTS
          </span>

          <h1>
            Nothing to show here.
          </h1>

          <p>
            Finish a Daily Challenge
            first to see your results.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                '/daily-challenge',
              )
            }
          >
            START DAILY CHALLENGE
            <span>→</span>
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="daily-results">

      {confettiPieces.map(
        (piece) => (
          <span
            key={piece.id}
            className={`daily-results__confetti daily-results__confetti--${celebrationLevel}`}
            style={{
              left: `${piece.left}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              transform: `rotate(${piece.rotation}deg)`,
            }}
          />
        ),
      )}

      <div className="daily-results__container">

        <div className="daily-results__orb daily-results__orb--one" />
        <div className="daily-results__orb daily-results__orb--two" />

        <header className="daily-results__hero">

          <div className="daily-results__hero-icon">
            ★
          </div>

          <p className="daily-results__eyebrow">
            DAILY CHALLENGE COMPLETE
          </p>

          <h1>
            {resultMessage}
          </h1>

          <p className="daily-results__subtitle">
            You heard it. Now prove it.
          </p>

          <div className="daily-results__score">
            <span>
              FINAL SCORE
            </span>

            <strong>
              {score.toLocaleString()}
            </strong>

            <small>
              POINTS
            </small>
          </div>

        </header>

        <section className="daily-results__stats">

          <div className="daily-results__stat">
            <span className="daily-results__stat-icon">
              ✓
            </span>

            <div>
              <small>
                CORRECT
              </small>

              <strong>
                {correctAnswers}
                <span>
                  /{questionCount}
                </span>
              </strong>
            </div>
          </div>

          <div className="daily-results__stat">
            <span className="daily-results__stat-icon">
              %
            </span>

            <div>
              <small>
                ACCURACY
              </small>

              <strong>
                {accuracy}%
              </strong>
            </div>
          </div>

          <div className="daily-results__stat">
            <span className="daily-results__stat-icon">
              🔥
            </span>

            <div>
              <small>
                BEST STREAK
              </small>

              <strong>
                {bestStreak}
              </strong>
            </div>
          </div>

          <div className="daily-results__stat">
            <span className="daily-results__stat-icon">
              ♪
            </span>

            <div>
              <small>
                LISTENED
              </small>

              <strong>
                {totalListeningTime.toFixed(
                  1,
                )}
                <span>
                  s
                </span>
              </strong>
            </div>
          </div>

        </section>

        <section className="daily-results__challenge-card">

          <div>
            <span>
              TODAY'S CHALLENGE
            </span>

            <h2>
              {challenge.theme.name}
            </h2>

            <p>
              {challenge.theme.description}
            </p>
          </div>

          <div className="daily-results__twist">

            <span className="daily-results__twist-icon">
              ⚡
            </span>

            <div>
              <small>
                DAILY TWIST
              </small>

              <strong>
                {challenge.twist.name}
              </strong>

              <span>
                {challenge.twist.description}
              </span>
            </div>

          </div>

        </section>

        <section className="daily-results__breakdown">

          <div className="daily-results__section-heading">

            <div>
              <p>
                YOUR RUN
              </p>

              <h2>
                Question Breakdown
              </h2>
            </div>

            <span>
              {questionResults.length}
              {' '}
              QUESTIONS
            </span>

          </div>

          <div className="daily-results__questions">

            {questionResults.map(
              (
                result,
                index,
              ) => (
                <article
                  key={
                    result.questionId
                  }
                  className={`daily-results__question ${
                    result.isCorrect
                      ? 'daily-results__question--correct'
                      : 'daily-results__question--wrong'
                  }`}
                >

                  <div className="daily-results__question-number">
                    {String(
                      index + 1,
                    ).padStart(
                      2,
                      '0',
                    )}
                  </div>

                  <img
                    src={
                      result.artworkUrl
                    }
                    alt={`${result.songTitle} artwork`}
                    className="daily-results__artwork"
                  />

                  <div className="daily-results__question-info">

                    <span className="daily-results__question-type">
                      {getQuestionLabel(
                        result.questionType,
                      )}
                    </span>

                    <h3>
                      {result.songTitle}
                    </h3>

                    <p>
                      {result.artist}
                      {' · '}
                      {result.album}
                    </p>

                    {result.questionType ===
                      'guess-the-year' &&
                      result.releaseYear && (
                        <span className="daily-results__year">
                          {result.releaseYear}
                        </span>
                      )}

                  </div>

                  <div className="daily-results__question-answer">

                    <span
                      className={
                        result.isCorrect
                          ? 'daily-results__status daily-results__status--correct'
                          : 'daily-results__status daily-results__status--wrong'
                      }
                    >
                      {result.isCorrect
                        ? '✓ CORRECT'
                        : result.revealed
                          ? '! REVEALED'
                          : '× MISSED'}
                    </span>

                    {!result.isCorrect && (
                      <small>
                        ANSWER:{' '}
                        <strong>
                          {
                            result.correctAnswer
                          }
                        </strong>
                      </small>
                    )}

                    {result.isCorrect && (
                      <small>
                        {result.listenDuration.toFixed(
                          1,
                        )}
                        s LISTEN
                      </small>
                    )}

                  </div>

                  <div className="daily-results__question-points">

                    <span>
                      POINTS
                    </span>

                    <strong>
                      {result.points > 0
                        ? `+${result.points}`
                        : '—'}
                    </strong>

                  </div>

                </article>
              ),
            )}

          </div>

        </section>

        <section className="daily-results__bottom">

          <div className="daily-results__bottom-message">

            <span>
              TOMORROW'S ANOTHER ROUND.
            </span>

            <strong>
              Think you can beat this score?
            </strong>

          </div>

          <div className="daily-results__actions">

            <button
              type="button"
              className="daily-results__play"
              onClick={() =>
                navigate(
                  '/daily-challenge',
                )
              }
            >
              PLAY AGAIN
              <span>↻</span>
            </button>

            <button
              type="button"
              className="daily-results__home"
              onClick={() =>
                navigate('/')
              }
            >
              BACK HOME
            </button>

          </div>

        </section>

      </div>

    </main>
  )
}

export default DailyChallengeResults
