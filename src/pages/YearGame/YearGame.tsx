import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
} from 'lucide-react'

import { generateQuestion } from '../../services/gameService'
import { submitScore } from '../../services/scoreService'

import {
  calculateFinalPoints,
} from '../../lib/gameScoring'

import type { Question } from '../../types/game'

import './YearGame.css'

const ROUND_LENGTH = 10
const TOTAL_QUESTIONS = 10

type YearRecognitionResult = {
  questionNumber: number
  title: string
  artist: string
  album: string
  artworkUrl: string
  releaseYear: number
  recognitionTime: number
  correct: boolean
  points: number
}

function YearGame() {
  const navigate = useNavigate()

  const [question, setQuestion] =
    useState<Question | null>(null)

  const [questionNumber, setQuestionNumber] =
    useState(1)

  const [timeRemaining, setTimeRemaining] =
    useState(ROUND_LENGTH)

  const [isPlaying, setIsPlaying] =
    useState(false)

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null)

  const [hasAnswered, setHasAnswered] =
    useState(false)

  const [isTimeUp, setIsTimeUp] =
    useState(false)

  const [results, setResults] =
    useState<YearRecognitionResult[]>([])

  const [showResults, setShowResults] =
    useState(false)

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  /*
   * SCORE
   */

  const [score, setScore] =
    useState(0)

  const [streak, setStreak] =
    useState(0)

  const [bestStreak, setBestStreak] =
    useState(0)

  /*
   * SCORE SUBMISSION
   */

  const scoreSubmitted =
    useRef(false)

  const audioRef =
    useRef<HTMLAudioElement | null>(null)

  const timerRef =
    useRef<number | null>(null)

  /*
   * LOAD FIRST QUESTION
   */

  useEffect(() => {
    loadQuestion()
  }, [])

  /*
   * CLEANUP
   */

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(
          timerRef.current,
        )
      }

      audioRef.current?.pause()
    }
  }, [])

  /*
   * COUNTDOWN
   */

  useEffect(() => {
    if (
      !isPlaying ||
      hasAnswered ||
      isTimeUp
    ) {
      return
    }

    timerRef.current =
      window.setInterval(() => {
        setTimeRemaining((previous) => {
          if (previous <= 0.1) {
            if (
              timerRef.current !== null
            ) {
              window.clearInterval(
                timerRef.current,
              )
            }

            handleTimeUp()

            return 0
          }

          return Number(
            (previous - 0.1).toFixed(1),
          )
        })
      }, 100)

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(
          timerRef.current,
        )
      }
    }
  }, [
    isPlaying,
    hasAnswered,
    isTimeUp,
  ])

  /*
   * SAVE SCORE WHEN RESULTS ARE SHOWN
   */

  useEffect(() => {
    if (
      !showResults ||
      scoreSubmitted.current
    ) {
      return
    }

    if (
      results.length <
      TOTAL_QUESTIONS
    ) {
      return
    }

    scoreSubmitted.current = true

    const correctAnswers =
      results.filter(
        (result) => result.correct,
      ).length

    const accuracy =
      TOTAL_QUESTIONS > 0
        ? (correctAnswers /
            TOTAL_QUESTIONS) *
          100
        : 0

    const totalListeningTime =
      results.reduce(
        (total, result) =>
          total + result.recognitionTime,
        0,
      )

    async function saveScore() {
      try {
        await submitScore({
          gameMode: 'guess-the-year',
          score,
          accuracy,
          bestStreak,
          questions: TOTAL_QUESTIONS,
          correctAnswers,
          totalListeningTime,
        })

        console.log(
          'YEAR GAME SCORE SAVED:',
          {
            score,
            accuracy,
            bestStreak,
            questions: TOTAL_QUESTIONS,
            correctAnswers,
            totalListeningTime,
          },
        )
      } catch (error) {
        console.error(
          'FAILED TO SAVE YEAR GAME SCORE:',
          error,
        )
      }
    }

    saveScore()
  }, [
    showResults,
    results,
    score,
    bestStreak,
  ])

  /*
   * LOAD QUESTION
   */

  async function loadQuestion() {
    setIsLoading(true)
    setError(null)

    setQuestion(null)
    setSelectedAnswer(null)
    setHasAnswered(false)
    setIsTimeUp(false)
    setIsPlaying(false)
    setTimeRemaining(ROUND_LENGTH)

    try {
      const generatedQuestion =
        await generateQuestion(
          'guess-the-year',
          'medium',
        )

      setQuestion(
        generatedQuestion,
      )
    } catch (err) {
      console.error(
        'Failed to generate year question:',
        err,
      )

      setError(
        'We could not load the next song. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  /*
   * PLAY / PAUSE
   */

  function togglePlayback() {
    const audio =
      audioRef.current

    if (!audio || !question) {
      return
    }

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    audio
      .play()
      .then(() => {
        setIsPlaying(true)
      })
      .catch((err) => {
        console.error(
          'Unable to play preview:',
          err,
        )
      })
  }

  /*
   * ANSWER
   */

  function handleAnswer(
    answer: string,
  ) {
    if (
      hasAnswered ||
      isTimeUp ||
      !question
    ) {
      return
    }

    const recognitionTime = Math.min(
      ROUND_LENGTH,
      Math.max(
        0,
        ROUND_LENGTH - timeRemaining,
      ),
    )

    const correct =
      answer ===
      question.correctAnswer

    const nextStreak =
      correct
        ? streak + 1
        : 0

    const earnedPoints =
      correct
        ? calculateFinalPoints(
            recognitionTime,
            nextStreak,
          )
        : 0

    setSelectedAnswer(answer)
    setHasAnswered(true)
    setIsPlaying(false)

    setStreak(nextStreak)

    if (correct) {
      setBestStreak(
        (currentBest) =>
          Math.max(
            currentBest,
            nextStreak,
          ),
      )
    }

    setScore(
      (currentScore) =>
        currentScore + earnedPoints,
    )

    if (timerRef.current !== null) {
      window.clearInterval(
        timerRef.current,
      )
    }

    audioRef.current?.pause()

    setResults((previous) => [
      ...previous,
      {
        questionNumber,
        title: question.song.title,
        artist: question.song.artist,
        album: question.song.album,
        artworkUrl:
          question.song.artworkUrl,
        releaseYear:
          question.song.releaseYear!,
        recognitionTime,
        correct,
        points: earnedPoints,
      },
    ])
  }

  /*
   * TIME UP
   */

  function handleTimeUp() {
    if (
      hasAnswered ||
      isTimeUp ||
      !question
    ) {
      return
    }

    setIsTimeUp(true)
    setIsPlaying(false)
    setStreak(0)

    audioRef.current?.pause()

    if (timerRef.current !== null) {
      window.clearInterval(
        timerRef.current,
      )
    }

    setResults((previous) => [
      ...previous,
      {
        questionNumber,
        title: question.song.title,
        artist: question.song.artist,
        album: question.song.album,
        artworkUrl:
          question.song.artworkUrl,
        releaseYear:
          question.song.releaseYear!,
        recognitionTime: ROUND_LENGTH,
        correct: false,
        points: 0,
      },
    ])
  }

  /*
   * NEXT QUESTION
   */

  async function handleNext() {
    if (
      questionNumber >= TOTAL_QUESTIONS
    ) {
      setShowResults(true)
      return
    }

    setQuestionNumber(
      (previous) => previous + 1,
    )

    await loadQuestion()
  }

  /*
   * RETRY
   */

  function handleRetry() {
    loadQuestion()
  }

  /*
   * PLAY AGAIN
   */

  function handlePlayAgain() {
    window.location.reload()
  }

  if (showResults) {
    return (
      <YearResultsScreen
        results={results}
        score={score}
        bestStreak={bestStreak}
        onPlayAgain={
          handlePlayAgain
        }
        onBack={() =>
          navigate('/play')
        }
      />
    )
  }

  return (
    <div className="year-game">
      <div className="year-game__container">
        <header className="year-game__header">
          <div>
            <p className="year-game__eyebrow">
              GUESS THE YEAR
            </p>

            <h1 className="year-game__title">
              When was it released?
            </h1>
          </div>

          <div className="year-game__progress">
            <span>
              {String(
                questionNumber,
              ).padStart(2, '0')}
            </span>

            <span>
              / {String(
                TOTAL_QUESTIONS,
              ).padStart(2, '0')}
            </span>
          </div>
        </header>

        {isLoading && (
          <div className="year-game__loading">
            <div className="year-game__loading-spinner" />

            <p>
              Finding your next song...
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="year-game__error-state">
            <p>{error}</p>

            <button
              className="year-game__retry"
              onClick={
                handleRetry
              }
            >
              <RotateCcw size={18} />
              TRY AGAIN
            </button>
          </div>
        )}

        {question &&
          !isLoading &&
          !error && (
            <>
              <section className="year-game__player-card">
                <div className="year-game__timer">
                  <span>
                    {isTimeUp
                      ? "TIME'S UP"
                      : hasAnswered
                        ? 'ANSWER LOCKED'
                        : 'LISTEN'}
                  </span>

                  <strong
                    className={
                      timeRemaining <= 3 &&
                      !hasAnswered &&
                      !isTimeUp
                        ? 'year-game__timer--urgent'
                        : ''
                    }
                  >
                    {timeRemaining.toFixed(
                      1,
                    )}
                    s
                  </strong>
                </div>

                <div className="year-game__wave">
                  {Array.from(
                    { length: 32 },
                    (_, index) => (
                      <span
                        key={index}
                        className={
                          isPlaying
                            ? 'year-game__wave-bar year-game__wave-bar--active'
                            : 'year-game__wave-bar'
                        }
                      />
                    ),
                  )}
                </div>

                <button
                  className="year-game__play"
                  onClick={
                    togglePlayback
                  }
                  disabled={
                    hasAnswered ||
                    isTimeUp
                  }
                  aria-label={
                    isPlaying
                      ? 'Pause song'
                      : 'Play song'
                  }
                >
                  {isPlaying ? (
                    <Pause
                      size={30}
                      fill="currentColor"
                    />
                  ) : (
                    <Play
                      size={30}
                      fill="currentColor"
                    />
                  )}
                </button>

                <div className="year-game__player-bottom">
                  <Volume2 size={15} />

                  <div className="year-game__progress-track">
                    <div
                      className="year-game__progress-fill"
                      style={{
                        width: `${
                          ((ROUND_LENGTH -
                            timeRemaining) /
                            ROUND_LENGTH) *
                          100
                        }%`,
                      }}
                    />
                  </div>

                  <span>
                    10s
                  </span>
                </div>

                <audio
                  ref={audioRef}
                  src={
                    question.song.audioUrl
                  }
                  preload="auto"
                  onEnded={() =>
                    setIsPlaying(false)
                  }
                />
              </section>

              {hasAnswered ||
              isTimeUp ? (
                <section className="year-game__reveal">
                  <div className="year-game__reveal-art">
                    {question.song
                      .artworkUrl ? (
                      <img
                        src={
                          question.song
                            .artworkUrl
                        }
                        alt={`${question.song.album} album artwork`}
                      />
                    ) : (
                      <div className="year-game__reveal-art-placeholder">
                        ?
                      </div>
                    )}
                  </div>

                  <div className="year-game__reveal-content">
                    <p className="year-game__reveal-label">
                      {isTimeUp
                        ? "TIME'S UP"
                        : selectedAnswer ===
                            question.correctAnswer
                          ? 'CORRECT'
                          : 'NOT QUITE'}
                    </p>

                    <strong className="year-game__correct-year">
                      {
                        question.song
                          .releaseYear
                      }
                    </strong>

                    <h2>
                      {
                        question.song
                          .title
                      }
                    </h2>

                    <p>
                      {
                        question.song
                          .artist
                      }
                      {' · '}
                      {
                        question.song
                          .album
                      }
                    </p>
                  </div>

                  <div
                    className={`year-game__result ${
                      selectedAnswer ===
                      question.correctAnswer
                        ? 'year-game__result--correct'
                        : 'year-game__result--wrong'
                    }`}
                  >
                    {selectedAnswer ===
                    question.correctAnswer
                      ? '✓'
                      : '×'}
                  </div>
                </section>
              ) : (
                <section className="year-game__answers">
                  <div className="year-game__answers-header">
                    <div>
                      <p>
                        WHEN WAS IT RELEASED?
                      </p>

                      <span>
                        TRUST YOUR INSTINCT
                      </span>
                    </div>

                    <span>
                      4 CHOICES
                    </span>
                  </div>

                  <div className="year-game__answer-grid">
                    {question.answers.map(
                      (
                        answer,
                        index,
                      ) => (
                        <button
                          key={answer}
                          className="year-game__answer"
                          onClick={() =>
                            handleAnswer(
                              answer,
                            )
                          }
                        >
                          <span className="year-game__answer-number">
                            {String(
                              index + 1,
                            ).padStart(
                              2,
                              '0',
                            )}
                          </span>

                          <strong className="year-game__answer-year">
                            {answer}
                          </strong>

                          <ArrowRight
                            size={18}
                            className="year-game__answer-arrow"
                          />
                        </button>
                      ),
                    )}
                  </div>
                </section>
              )}

              {(hasAnswered ||
                isTimeUp) && (
                <button
                  className="year-game__next"
                  onClick={
                    handleNext
                  }
                >
                  <span>
                    {questionNumber >=
                    TOTAL_QUESTIONS
                      ? 'SEE RESULTS'
                      : 'NEXT SONG'}
                  </span>

                  <ArrowRight size={19} />
                </button>
              )}
            </>
          )}
      </div>
    </div>
  )
}

type YearResultsScreenProps = {
  results: YearRecognitionResult[]
  score: number
  bestStreak: number
  onPlayAgain: () => void
  onBack: () => void
}

function YearResultsScreen({
  results,
  score,
  bestStreak,
  onPlayAgain,
  onBack,
}: YearResultsScreenProps) {
  const correctResults =
    results.filter(
      (result) => result.correct,
    )

  const recognizedCount =
    correctResults.length

  const accuracy =
    results.length > 0
      ? Math.round(
          (recognizedCount /
            results.length) *
            100,
        )
      : 0

  const recognitionTimes =
    correctResults.map(
      (result) =>
        result.recognitionTime,
    )

  const averageTime =
    recognitionTimes.length > 0
      ? recognitionTimes.reduce(
          (total, time) =>
            total + time,
          0,
        ) /
        recognitionTimes.length
      : 0

  const fastestTime =
    recognitionTimes.length > 0
      ? Math.min(
          ...recognitionTimes,
        )
      : 0

  const fastestResult =
    correctResults.find(
      (result) =>
        result.recognitionTime ===
        fastestTime,
    )

  return (
    <div className="year-results">
      <div className="year-results__confetti">
        {Array.from(
          { length: 36 },
          (_, index) => (
            <span
              key={index}
              className="year-results__confetti-piece"
            />
          ),
        )}
      </div>

      <div className="year-results__container">
        <header className="year-results__header">
          <div className="year-results__trophy">
            <Trophy size={28} />
          </div>

          <p className="year-results__eyebrow">
            ROUND COMPLETE
          </p>

          <h1>
            You know your music history.
          </h1>

          <p>
            You dated{' '}
            <strong>
              {recognizedCount}
            </strong>{' '}
            out of {results.length}{' '}
            songs correctly.
          </p>
        </header>

        <section className="year-results__score">
          <div>
            <span>
              FINAL SCORE
            </span>

            <strong>
              {score}
            </strong>
          </div>

          <div>
            <span>
              BEST STREAK
            </span>

            <strong>
              {bestStreak}
            </strong>
          </div>
        </section>

        <section className="year-results__score">
          <div>
            <span>
              YEARS GUESSED
            </span>

            <strong>
              {recognizedCount}
              <small>
                /{results.length}
              </small>
            </strong>
          </div>

          <div>
            <span>
              ACCURACY
            </span>

            <strong>
              {accuracy}%
            </strong>
          </div>
        </section>

        <section className="year-results__speed">
          <div className="year-results__section-heading">
            <p>YEAR RECOGNITION SPEED</p>

            <span>
              HOW FAST DID YOU KNOW?
            </span>
          </div>

          <div className="year-results__speed-grid">
            <div>
              <span>AVERAGE</span>

              <strong>
                {averageTime.toFixed(1)}s
              </strong>
            </div>

            <div>
              <span>FASTEST</span>

              <strong>
                {fastestTime > 0
                  ? `${fastestTime.toFixed(
                      1,
                    )}s`
                  : '—'}
              </strong>
            </div>

            <div>
              <span>FASTEST YEAR</span>

              <strong>
                {fastestResult
                  ?.releaseYear ?? '—'}
              </strong>
            </div>
          </div>
        </section>

        <section className="year-results__breakdown">
          <div className="year-results__section-heading">
            <p>YOUR TIMELINE</p>

            <span>
              {results.length} SONGS
            </span>
          </div>

          <div className="year-results__list">
            {results.map(
              (result) => (
                <div
                  className="year-results__item"
                  key={
                    result.questionNumber
                  }
                >
                  <span className="year-results__number">
                    {String(
                      result.questionNumber,
                    ).padStart(
                      2,
                      '0',
                    )}
                  </span>

                  <div className="year-results__art">
                    {result.artworkUrl ? (
                      <img
                        src={
                          result.artworkUrl
                        }
                        alt=""
                      />
                    ) : (
                      <span>?</span>
                    )}
                  </div>

                  <div className="year-results__info">
                    <strong>
                      {result.title}
                    </strong>

                    <span>
                      {result.artist}
                      {' · '}
                      {result.album}
                    </span>
                  </div>

                  <div className="year-results__year">
                    <strong>
                      {result.releaseYear}
                    </strong>

                    <span
                      className={
                        result.correct
                          ? 'year-results__time'
                          : 'year-results__missed'
                      }
                    >
                      {result.correct
                        ? `+${result.points} · ${result.recognitionTime.toFixed(
                            1,
                          )}s ✓`
                        : 'MISSED ×'}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        {fastestResult && (
          <section className="year-results__fastest">
            <span>⚡</span>

            <div>
              <p>
                FASTEST RECOGNITION
              </p>

              <strong>
                {fastestResult.releaseYear}
              </strong>

              <small>
                {fastestResult.title} ·{' '}
                {fastestResult.artist}
                {' — '}
                recognized in{' '}
                {fastestResult.recognitionTime.toFixed(
                  1,
                )}
                s
              </small>
            </div>
          </section>
        )}

        <div className="year-results__actions">
          <button
            className="year-results__primary"
            onClick={
              onPlayAgain
            }
          >
            <RotateCcw size={18} />
            PLAY AGAIN
          </button>

          <button
            className="year-results__secondary"
            onClick={onBack}
          >
            BACK TO PLAY
          </button>
        </div>
      </div>
    </div>
  )
}

export default YearGame