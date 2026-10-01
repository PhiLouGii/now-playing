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

import LoadingScreen from '../../components/loading/LoadingScreen'

import {
  generateQuestion,
  getLoadingFacts,
  type LoadingFact,
} from '../../services/gameService'

import { submitScore } from '../../services/scoreService'

import {
  calculateFinalPoints,
} from '../../lib/gameScoring'

import type { Question } from '../../types/game'

import './AlbumGame.css'

const ROUND_LENGTH = 10
const TOTAL_QUESTIONS = 10

type AlbumRecognitionResult = {
  questionNumber: number
  title: string
  artist: string
  album: string
  artworkUrl: string
  recognitionTime: number
  correct: boolean
  points: number
}

function AlbumGame() {
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
    useState<AlbumRecognitionResult[]>([])

  const [showResults, setShowResults] =
    useState(false)

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  /*
   * LOADING SCREEN
   */

  const [loadingFacts, setLoadingFacts] =
    useState<LoadingFact[]>([])

  const [
    loadingComplete,
    setLoadingComplete,
  ] = useState(false)

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
   * Generate the first question.
   */

  useEffect(() => {
    let isMounted = true

    async function initializeGame() {
      setIsLoading(true)
      setLoadingComplete(false)

      /*
       * Load the shared music facts independently
       * from the question itself.
       */
      getLoadingFacts()
        .then((data) => {
          if (isMounted) {
            setLoadingFacts(
              data.facts,
            )
          }
        })
        .catch((error) => {
          console.error(
            'Failed to load loading facts:',
            error,
          )
        })

      await loadQuestion(
        isMounted,
      )
    }

    initializeGame()

    return () => {
      isMounted = false
    }
  }, [])

  /*
   * Clean up timer and audio.
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
   * Countdown.
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
   * SAVE SCORE WHEN RESULTS ARE SHOWN.
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
          gameMode: 'name-the-album',
          score,
          accuracy,
          bestStreak,
          questions: TOTAL_QUESTIONS,
          correctAnswers,
          totalListeningTime,
        })

        console.log(
          'ALBUM GAME SCORE SAVED:',
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
          'FAILED TO SAVE ALBUM GAME SCORE:',
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
   * Generate a new album question.
   */

  async function loadQuestion(
    isInitialLoad = false,
  ) {
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
          'name-the-album',
          'medium',
        )

      setQuestion(
        generatedQuestion,
      )

      /*
       * Only the initial question controls
       * the shared full-screen loading state.
       */
      if (isInitialLoad) {
        setLoadingComplete(true)
      }
    } catch (err) {
      console.error(
        'Failed to generate album question:',
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
   * Start / pause the preview.
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
   * Submit an album answer.
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
        recognitionTime,
        correct,
        points: earnedPoints,
      },
    ])
  }

  /*
   * Handle the player reaching 10 seconds.
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
        recognitionTime: ROUND_LENGTH,
        correct: false,
        points: 0,
      },
    ])
  }

  /*
   * Move to the next question.
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
   * Retry if question generation fails.
   */

  function handleRetry() {
    loadQuestion()
  }

  /*
   * Restart the complete round.
   */

  function handlePlayAgain() {
    window.location.reload()
  }

  /*
   * SHARED LOADING SCREEN
   */

  if (isLoading && !question) {
    return (
      <LoadingScreen
        facts={loadingFacts}
        message="Loading Name the Album..."
        isComplete={loadingComplete}
      />
    )
  }

  if (showResults) {
    return (
      <AlbumResultsScreen
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
    <div className="album-game">
      <div className="album-game__container">
        <header className="album-game__header">
          <div>
            <p className="album-game__eyebrow">
              GUESS THE ALBUM
            </p>

            <h1 className="album-game__title">
              Which album is it?
            </h1>
          </div>

          <div className="album-game__progress">
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
          <div className="album-game__loading">
            <div className="album-game__loading-spinner" />

            <p>
              Finding your next song...
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="album-game__error-state">
            <p>{error}</p>

            <button
              className="album-game__retry"
              onClick={
                handleRetry
              }
            >
              <RotateCcw
                size={18}
              />

              TRY AGAIN
            </button>
          </div>
        )}

        {question &&
          !isLoading &&
          !error && (
            <>
              <section className="album-game__player-card">
                <div className="album-game__timer">
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
                        ? 'album-game__timer--urgent'
                        : ''
                    }
                  >
                    {timeRemaining.toFixed(
                      1,
                    )}
                    s
                  </strong>
                </div>

                <div className="album-game__wave">
                  {Array.from(
                    { length: 32 },
                    (_, index) => (
                      <span
                        key={index}
                        className={
                          isPlaying
                            ? 'album-game__wave-bar album-game__wave-bar--active'
                            : 'album-game__wave-bar'
                        }
                      />
                    ),
                  )}
                </div>

                <button
                  className="album-game__play"
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

                <div className="album-game__player-bottom">
                  <Volume2
                    size={15}
                  />

                  <div className="album-game__progress-track">
                    <div
                      className="album-game__progress-fill"
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
                <section className="album-game__reveal">
                  <div className="album-game__reveal-art">
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
                      <div className="album-game__reveal-art-placeholder">
                        ?
                      </div>
                    )}
                  </div>

                  <div className="album-game__reveal-content">
                    <p className="album-game__reveal-label">
                      {isTimeUp
                        ? "TIME'S UP"
                        : selectedAnswer ===
                            question.correctAnswer
                          ? 'CORRECT'
                          : 'NOT QUITE'}
                    </p>

                    <h2>
                      {
                        question.song
                          .album
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
                          .title
                      }
                    </p>
                  </div>

                  <div
                    className={`album-game__result ${
                      selectedAnswer ===
                      question.correctAnswer
                        ? 'album-game__result--correct'
                        : 'album-game__result--wrong'
                    }`}
                  >
                    {selectedAnswer ===
                    question.correctAnswer
                      ? '✓'
                      : '×'}
                  </div>
                </section>
              ) : (
                <section className="album-game__answers">
                  <div className="album-game__answers-header">
                    <p>
                      SELECT THE ALBUM
                    </p>

                    <span>
                      4 CHOICES
                    </span>
                  </div>

                  <div className="album-game__answer-grid">
                    {question.answers.map(
                      (
                        answer,
                        index,
                      ) => (
                        <button
                          key={answer}
                          className="album-game__answer"
                          onClick={() =>
                            handleAnswer(
                              answer,
                            )
                          }
                        >
                          <span className="album-game__answer-number">
                            {String(
                              index + 1,
                            ).padStart(
                              2,
                              '0',
                            )}
                          </span>

                          <span className="album-game__answer-text">
                            {answer}
                          </span>

                          <ArrowRight
                            size={18}
                            className="album-game__answer-arrow"
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
                  className="album-game__next"
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

                  <ArrowRight
                    size={19}
                  />
                </button>
              )}
            </>
          )}
      </div>
    </div>
  )
}

type AlbumResultsScreenProps = {
  results: AlbumRecognitionResult[]
  score: number
  bestStreak: number
  onPlayAgain: () => void
  onBack: () => void
}

function AlbumResultsScreen({
  results,
  score,
  bestStreak,
  onPlayAgain,
  onBack,
}: AlbumResultsScreenProps) {
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
    <div className="album-results">
      <div className="album-results__confetti">
        {Array.from(
          { length: 36 },
          (_, index) => (
            <span
              key={index}
              className="album-results__confetti-piece"
            />
          ),
        )}
      </div>

      <div className="album-results__container">
        <header className="album-results__header">
          <div className="album-results__trophy">
            <Trophy size={28} />
          </div>

          <p className="album-results__eyebrow">
            ROUND COMPLETE
          </p>

          <h1>
            You know your albums.
          </h1>

          <p>
            You recognized{' '}
            <strong>
              {recognizedCount}
            </strong>{' '}
            out of {results.length}.
          </p>
        </header>

        <section className="album-results__score">
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

        <section className="album-results__score">
          <div>
            <span>
              ALBUMS RECOGNIZED
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

        <section className="album-results__speed">
          <div className="album-results__section-heading">
            <p>ALBUM RECOGNITION SPEED</p>

            <span>
              HOW FAST DID YOU KNOW?
            </span>
          </div>

          <div className="album-results__speed-grid">
            <div>
              <span>AVERAGE</span>

              <strong>
                {averageTime.toFixed(
                  1,
                )}
                s
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
              <span>FASTEST ALBUM</span>

              <strong>
                {fastestResult
                  ?.album ?? '—'}
              </strong>
            </div>
          </div>
        </section>

        <section className="album-results__breakdown">
          <div className="album-results__section-heading">
            <p>YOUR ALBUMS</p>

            <span>
              {results.length} SONGS
            </span>
          </div>

          <div className="album-results__list">
            {results.map(
              (result) => (
                <div
                  className="album-results__item"
                  key={
                    result.questionNumber
                  }
                >
                  <span className="album-results__number">
                    {String(
                      result.questionNumber,
                    ).padStart(
                      2,
                      '0',
                    )}
                  </span>

                  <div className="album-results__art">
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

                  <div className="album-results__info">
                    <strong>
                      {result.album}
                    </strong>

                    <span>
                      {result.artist}
                      {' · '}
                      {result.title}
                    </span>
                  </div>

                  <span
                    className={
                      result.correct
                        ? 'album-results__time'
                        : 'album-results__missed'
                    }
                  >
                    {result.correct
                      ? `+${result.points} · ${result.recognitionTime.toFixed(
                          1,
                        )}s ✓`
                      : 'MISSED ×'}
                  </span>
                </div>
              ),
            )}
          </div>
        </section>

        {fastestResult && (
          <section className="album-results__fastest">
            <span>⚡</span>

            <div>
              <p>
                FASTEST RECOGNITION
              </p>

              <strong>
                {fastestResult.album}
              </strong>

              <small>
                Recognized in{' '}
                {fastestResult.recognitionTime.toFixed(
                  1,
                )}
                s
              </small>
            </div>
          </section>
        )}

        <div className="album-results__actions">
          <button
            className="album-results__primary"
            onClick={
              onPlayAgain
            }
          >
            <RotateCcw size={18} />
            PLAY AGAIN
          </button>

          <button
            className="album-results__secondary"
            onClick={onBack}
          >
            BACK TO PLAY
          </button>
        </div>
      </div>
    </div>
  )
}

export default AlbumGame