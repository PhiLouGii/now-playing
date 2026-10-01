import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  ArrowRight,
  Check,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  X,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'

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

import './ArtistGame.css'

const ROUND_LENGTH = 10
const TOTAL_QUESTIONS = 10

type AnswerStatus =
  | 'idle'
  | 'correct'
  | 'incorrect'
  | 'timeout'

type ArtistRecognitionResult = {
  questionNumber: number
  title: string
  artist: string
  album: string
  artworkUrl: string
  recognitionTime: number
  correct: boolean
  points: number
}

function ArtistGame() {
  const navigate = useNavigate()

  /*
   * --------------------------------------------------
   * QUESTION STATE
   * --------------------------------------------------
   */

  const [questions, setQuestions] =
    useState<Question[]>([])

  const [currentQuestion, setCurrentQuestion] =
    useState(0)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isLoadingNext, setIsLoadingNext] =
    useState(false)

  /*
   * --------------------------------------------------
   * LOADING SCREEN
   * --------------------------------------------------
   */

  const [loadingFacts, setLoadingFacts] =
    useState<LoadingFact[]>([])

  const [
    loadingComplete,
    setLoadingComplete,
  ] = useState(false)

  /*
   * --------------------------------------------------
   * ANSWER STATE
   * --------------------------------------------------
   */

  const [, setSelectedAnswer] =
    useState<string | null>(null)

  const [answerStatus, setAnswerStatus] =
    useState<AnswerStatus>('idle')

  /*
   * --------------------------------------------------
   * TIMER STATE
   * --------------------------------------------------
   */

  const [timeRemaining, setTimeRemaining] =
    useState(ROUND_LENGTH)

  const [isPlaying, setIsPlaying] =
    useState(false)

  /*
   * --------------------------------------------------
   * SCORE STATE
   * --------------------------------------------------
   */

  const [score, setScore] =
    useState(0)

  const [streak, setStreak] =
    useState(0)

  const [bestStreak, setBestStreak] =
    useState(0)

  /*
   * --------------------------------------------------
   * RESULTS STATE
   * --------------------------------------------------
   */

  const [
    recognitionResults,
    setRecognitionResults,
  ] = useState<ArtistRecognitionResult[]>([])

  const [isGameComplete, setIsGameComplete] =
    useState(false)

  /*
   * --------------------------------------------------
   * SCORE SUBMISSION
   * --------------------------------------------------
   */

  const scoreSubmitted =
    useRef(false)

  /*
   * --------------------------------------------------
   * AUDIO
   * --------------------------------------------------
   */

  const audioRef =
    useRef<HTMLAudioElement | null>(null)

  /*
   * --------------------------------------------------
   * LOAD FIRST QUESTION
   * --------------------------------------------------
   */

  useEffect(() => {
    let isMounted = true

    async function loadFirstQuestion() {
      setIsLoading(true)
      setLoadingComplete(false)

      /*
       * Loading facts are fetched independently
       * from the game data.
       */
      getLoadingFacts()
        .then(data => {
          if (isMounted) {
            setLoadingFacts(
              data.facts,
            )
          }
        })
        .catch(error => {
          console.error(
            'Failed to load loading facts:',
            error,
          )
        })

      try {
        const firstQuestion =
          await generateQuestion(
            'name-the-artist',
            'medium',
          )

        if (!isMounted) {
          return
        }

        setQuestions([
          firstQuestion,
        ])

        /*
         * The first Artist question has
         * finished loading successfully.
         */
        setLoadingComplete(true)
        setIsLoading(false)
      } catch (error) {
        console.error(
          'Failed to generate artist question:',
          error,
        )

        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadFirstQuestion()

    return () => {
      isMounted = false
    }
  }, [])

  /*
   * --------------------------------------------------
   * PRELOAD NEXT QUESTION
   * --------------------------------------------------
   */

  useEffect(() => {
    if (
      questions.length === 0 ||
      questions.length >= TOTAL_QUESTIONS
    ) {
      return
    }

    const nextIndex = questions.length

    let isMounted = true

    async function preloadNextQuestion() {
      try {
        const nextQuestion =
          await generateQuestion(
            'name-the-artist',
            'medium',
          )

        if (!isMounted) {
          return
        }

        setQuestions((current) => {
          if (
            current.length >
            nextIndex
          ) {
            return current
          }

          return [
            ...current,
            nextQuestion,
          ]
        })
      } catch (error) {
        console.error(
          'Failed to preload artist question:',
          error,
        )
      }
    }

    preloadNextQuestion()

    return () => {
      isMounted = false
    }
  }, [questions.length])

  /*
   * --------------------------------------------------
   * SAVE SCORE WHEN GAME IS COMPLETE
   * --------------------------------------------------
   */

  useEffect(() => {
    if (
      !isGameComplete ||
      scoreSubmitted.current
    ) {
      return
    }

    if (
      recognitionResults.length <
      TOTAL_QUESTIONS
    ) {
      return
    }

    scoreSubmitted.current = true

    const correctAnswers =
      recognitionResults.filter(
        (result) =>
          result.correct,
      ).length

    const accuracy =
      TOTAL_QUESTIONS > 0
        ? (correctAnswers /
            TOTAL_QUESTIONS) *
          100
        : 0

    const totalListeningTime =
      recognitionResults.reduce(
        (total, result) =>
          total +
          result.recognitionTime,
        0,
      )

    async function saveScore() {
      try {
        await submitScore({
          gameMode:
            'name-the-artist',
          score,
          accuracy,
          bestStreak,
          questions:
            TOTAL_QUESTIONS,
          correctAnswers,
          totalListeningTime,
        })

        console.log(
          'ARTIST GAME SCORE SAVED:',
          {
            score,
            accuracy,
            bestStreak,
            questions:
              TOTAL_QUESTIONS,
            correctAnswers,
            totalListeningTime,
          },
        )
      } catch (error) {
        console.error(
          'FAILED TO SAVE ARTIST GAME SCORE:',
          error,
        )
      }
    }

    saveScore()
  }, [
    isGameComplete,
    recognitionResults,
    score,
    bestStreak,
  ])

  /*
   * --------------------------------------------------
   * CURRENT QUESTION
   * --------------------------------------------------
   */

  const question =
    questions[currentQuestion]

  /*
   * --------------------------------------------------
   * RESET QUESTION
   * --------------------------------------------------
   */

  useEffect(() => {
    setTimeRemaining(
      ROUND_LENGTH,
    )

    setSelectedAnswer(null)

    setAnswerStatus('idle')

    setIsPlaying(false)

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [currentQuestion])

  /*
   * --------------------------------------------------
   * 10 SECOND COUNTDOWN
   * --------------------------------------------------
   */

  useEffect(() => {
    if (
      !isPlaying ||
      answerStatus !== 'idle' ||
      !question
    ) {
      return
    }

    const timer =
      window.setInterval(() => {
        setTimeRemaining(
          (current) => {
            if (current <= 0.1) {
              window.clearInterval(
                timer,
              )

              setIsPlaying(false)

              setAnswerStatus(
                'timeout',
              )

              setStreak(0)

              setRecognitionResults(
                (currentResults) => [
                  ...currentResults,
                  {
                    questionNumber:
                      currentQuestion +
                      1,

                    title:
                      question.song
                        .title,

                    artist:
                      question.song
                        .artist,

                    album:
                      question.song
                        .album,

                    artworkUrl:
                      question.song
                        .artworkUrl ??
                      '',

                    recognitionTime:
                      ROUND_LENGTH,

                    correct: false,

                    points: 0,
                  },
                ],
              )

              if (
                audioRef.current
              ) {
                audioRef.current.pause()
              }

              return 0
            }

            return Math.max(
              0,
              current - 0.1,
            )
          },
        )
      }, 100)

    return () => {
      window.clearInterval(
        timer,
      )
    }
  }, [
    isPlaying,
    answerStatus,
    currentQuestion,
    question,
  ])

  /*
   * --------------------------------------------------
   * PLAY / PAUSE
   * --------------------------------------------------
   */

  async function handlePlayPause() {
    if (
      !audioRef.current ||
      answerStatus !== 'idle'
    ) {
      return
    }

    if (isPlaying) {
      audioRef.current.pause()

      setIsPlaying(false)

      return
    }

    try {
      await audioRef.current.play()

      setIsPlaying(true)
    } catch (error) {
      console.error(
        'Could not play audio:',
        error,
      )
    }
  }

  /*
   * --------------------------------------------------
   * ANSWER
   * --------------------------------------------------
   */

  function handleAnswer(
    answer: string,
  ) {
    if (
      answerStatus !== 'idle' ||
      !question
    ) {
      return
    }

    const isCorrect =
      answer ===
      question.correctAnswer

    const recognitionTime =
      Math.min(
        ROUND_LENGTH,
        Math.max(
          0,
          ROUND_LENGTH -
            timeRemaining,
        ),
      )

    const nextStreak =
      isCorrect
        ? streak + 1
        : 0

    const earnedPoints =
      isCorrect
        ? calculateFinalPoints(
            recognitionTime,
            nextStreak,
          )
        : 0

    setSelectedAnswer(answer)

    setAnswerStatus(
      isCorrect
        ? 'correct'
        : 'incorrect',
    )

    setIsPlaying(false)

    setStreak(nextStreak)

    if (isCorrect) {
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
        currentScore +
        earnedPoints,
    )

    if (audioRef.current) {
      audioRef.current.pause()
    }

    setRecognitionResults(
      (currentResults) => [
        ...currentResults,
        {
          questionNumber:
            currentQuestion + 1,

          title:
            question.song.title,

          artist:
            question.song.artist,

          album:
            question.song.album,

          artworkUrl:
            question.song.artworkUrl ??
            '',

          recognitionTime,
          correct: isCorrect,
          points: earnedPoints,
        },
      ],
    )
  }

  /*
   * --------------------------------------------------
   * AUDIO ENDED
   * --------------------------------------------------
   */

  function handleAudioEnded() {
    setIsPlaying(false)
  }

  /*
   * --------------------------------------------------
   * NEXT SONG
   * --------------------------------------------------
   */

  async function handleNextSong() {
    if (
      currentQuestion >=
      TOTAL_QUESTIONS - 1
    ) {
      if (audioRef.current) {
        audioRef.current.pause()
      }

      setIsGameComplete(true)

      return
    }

    const nextIndex =
      currentQuestion + 1

    if (questions[nextIndex]) {
      setCurrentQuestion(
        nextIndex,
      )

      return
    }

    setIsLoadingNext(true)

    try {
      const nextQuestion =
        await generateQuestion(
          'name-the-artist',
          'medium',
        )

      setQuestions((current) => {
        if (
          current[nextIndex]
        ) {
          return current
        }

        return [
          ...current,
          nextQuestion,
        ]
      })

      setCurrentQuestion(
        nextIndex,
      )
    } catch (error) {
      console.error(
        'Failed to generate next artist question:',
        error,
      )
    } finally {
      setIsLoadingNext(false)
    }
  }

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (isLoading) {
    return (
      <LoadingScreen
        facts={loadingFacts}
        message="Loading Name the Artist..."
        isComplete={
          loadingComplete
        }
      />
    )
  }

  /*
   * --------------------------------------------------
   * NO QUESTION
   * --------------------------------------------------
   */

  if (
    !question &&
    !isGameComplete
  ) {
    return (
      <div className="artist-game">
        <div className="artist-game__container">

          <main className="artist-game__loading">

            <p className="artist-game__eyebrow">
              GUESS THE ARTIST
            </p>

            <h1>
              NO SONG AVAILABLE
            </h1>

            <p>
              We couldn't generate a
              song right now.
            </p>

          </main>

        </div>
      </div>
    )
  }

  /*
   * --------------------------------------------------
   * RESULTS
   * --------------------------------------------------
   */

  if (isGameComplete) {
    return (
      <ArtistResultsScreen
        results={
          recognitionResults
        }
        score={score}
        bestStreak={
          bestStreak
        }
        onPlayAgain={() =>
          window.location.reload()
        }
        onBackToPlay={() =>
          navigate('/play')
        }
      />
    )
  }

  const progress =
    ((ROUND_LENGTH -
      timeRemaining) /
      ROUND_LENGTH) *
    100

  const isRevealed =
    answerStatus !== 'idle'

  const isCorrect =
    answerStatus === 'correct'

  return (
    <div className="artist-game">
      <div className="artist-game__container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="artist-game__header">

          <div>

            <p className="artist-game__eyebrow">
              QUICK MODE
            </p>

            <h1 className="artist-game__title">
              Guess the Artist
            </h1>

          </div>

          <div className="artist-game__round">

            <span>
              ROUND
            </span>

            <strong>
              {currentQuestion + 1}

              <small>
                /{TOTAL_QUESTIONS}
              </small>
            </strong>

          </div>

        </header>

        {/* =================================================
            GAME BOARD
        ================================================= */}

        <main className="artist-game__board">

          {/* =================================================
              LEFT: QUESTION / AUDIO / REVEAL
          ================================================= */}

          <section className="artist-game__question">

            {!isRevealed ? (
              <>
                <p className="artist-game__prompt">
                  WHO IS THIS?
                </p>

                <h2>
                  Who performs this song?
                </h2>
              </>
            ) : (
              <>
                {question.song.artworkUrl ? (
                  <img
                    src={
                      question.song
                        .artworkUrl
                    }
                    alt={`${question.song.album} album cover`}
                    className="artist-game__artwork"
                  />
                ) : (
                  <div className="artist-game__artwork-placeholder">
                    <span>♪</span>
                  </div>
                )}

                <p className="artist-game__prompt">
                  SONG REVEALED
                </p>

                <h2>
                  {
                    question.song.title
                  }
                </h2>
              </>
            )}

            {/* AUDIO */}

            <section className="artist-game__audio">

              <audio
                ref={audioRef}
                key={question.id}
                src={
                  question.song
                    .audioUrl
                }
                preload="auto"
                onEnded={
                  handleAudioEnded
                }
              />

              <div className="artist-game__audio-top">

                <span>
                  10 SECOND SNIPPET
                </span>

                <strong
                  className={
                    timeRemaining <= 3 &&
                    !isRevealed
                      ? 'artist-game__timer artist-game__timer--urgent'
                      : 'artist-game__timer'
                  }
                >
                  {timeRemaining.toFixed(
                    1,
                  )}s
                </strong>

              </div>

              <div className="artist-game__player">

                <button
                  type="button"
                  className="artist-game__play"
                  onClick={
                    handlePlayPause
                  }
                  disabled={
                    isRevealed
                  }
                  aria-label={
                    isPlaying
                      ? 'Pause song'
                      : 'Play song'
                  }
                >
                  {isPlaying ? (
                    <Pause
                      size={21}
                      strokeWidth={2}
                    />
                  ) : (
                    <Play
                      size={21}
                      strokeWidth={2}
                    />
                  )}
                </button>

                <div className="artist-game__wave">

                  {Array.from({
                    length: 32,
                  }).map(
                    (_, index) => (
                      <span
                        key={index}
                        className={
                          isPlaying
                            ? 'artist-game__wave-bar artist-game__wave-bar--playing'
                            : 'artist-game__wave-bar'
                        }
                        style={{
                          height: `${
                            20 +
                            ((index *
                              17) %
                              45)
                          }%`,
                        }}
                      />
                    ),
                  )}

                </div>

              </div>

              <div className="artist-game__progress">

                <div
                  className="artist-game__progress-fill"
                  style={{
                    width: `${progress}%`,
                  }}
                />

              </div>

              <p className="artist-game__hint">
                {isRevealed
                  ? 'The answer has been revealed.'
                  : 'Pick an artist as soon as you know it.'}
              </p>

            </section>

          </section>

          {/* =================================================
              RIGHT: ANSWERS / RESULT
          ================================================= */}

          <section className="artist-game__play-panel">

            {!isRevealed ? (
              <section className="artist-game__answers">

                <div className="artist-game__answers-header">

                  <span>
                    CHOOSE ONE
                  </span>

                  <span>
                    4 OPTIONS
                  </span>

                </div>

                <div className="artist-game__answer-grid">

                  {question.answers.map(
                    (
                      answer,
                      index,
                    ) => (
                      <button
                        key={answer}
                        type="button"
                        className="artist-game__answer"
                        onClick={() =>
                          handleAnswer(
                            answer,
                          )
                        }
                      >
                        <span className="artist-game__answer-number">
                          {String(
                            index + 1,
                          ).padStart(
                            2,
                            '0',
                          )}
                        </span>

                        <span>
                          {answer}
                        </span>
                      </button>
                    ),
                  )}

                </div>

              </section>
            ) : (
              <section className="artist-game__reveal">

                <div
                  className={
                    isCorrect
                      ? 'artist-game__result artist-game__result--correct'
                      : 'artist-game__result artist-game__result--incorrect'
                  }
                >

                  <span>
                    {answerStatus ===
                    'timeout'
                      ? "TIME'S UP"
                      : isCorrect
                        ? 'CORRECT'
                        : 'NOT QUITE'}
                  </span>

                  <strong>
                    {answerStatus ===
                    'timeout'
                      ? `The artist was ${question.correctAnswer}.`
                      : isCorrect
                        ? 'You got it.'
                        : `The artist was ${question.correctAnswer}.`}
                  </strong>

                </div>

                <div className="artist-game__song-card">

                  {question.song.artworkUrl ? (
                    <img
                      src={
                        question.song
                          .artworkUrl
                      }
                      alt={`${question.song.album} album cover`}
                      className="artist-game__artwork"
                    />
                  ) : (
                    <div className="artist-game__artwork-placeholder">
                      <span>♪</span>
                    </div>
                  )}

                  <div className="artist-game__song-info">

                    <p className="artist-game__song-label">
                      YOU WERE LISTENING TO
                    </p>

                    <h3>
                      {
                        question.song
                          .title
                      }
                    </h3>

                    <p className="artist-game__artist">
                      {
                        question.song
                          .artist
                      }
                    </p>

                    <p className="artist-game__album">
                      {
                        question.song
                          .album
                      }
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  className="artist-game__next"
                  onClick={
                    handleNextSong
                  }
                  disabled={
                    isLoadingNext
                  }
                >
                  <span>
                    {isLoadingNext
                      ? 'LOADING...'
                      : currentQuestion >=
                          TOTAL_QUESTIONS -
                            1
                        ? 'SEE RESULTS'
                        : 'NEXT SONG'}
                  </span>

                  {!isLoadingNext && (
                    <ArrowRight
                      size={17}
                    />
                  )}

                </button>

              </section>
            )}

          </section>

        </main>

      </div>
    </div>
  )
}

/*
 * ==================================================
 * ARTIST RESULTS SCREEN
 * ==================================================
 */

type ArtistResultsScreenProps = {
  results: ArtistRecognitionResult[]
  score: number
  bestStreak: number
  onPlayAgain: () => void
  onBackToPlay: () => void
}

function ArtistResultsScreen({
  results,
  score,
  bestStreak,
  onPlayAgain,
  onBackToPlay,
}: ArtistResultsScreenProps) {
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

  const confettiPieces =
    Array.from({
      length: 36,
    })

  return (
    <div className="artist-results">

      {/* =================================================
          CONFETTI
      ================================================= */}

      <div
        className="artist-results__confetti"
        aria-hidden="true"
      >
        {confettiPieces.map(
          (_, index) => (
            <span
              key={index}
              className="artist-results__confetti-piece"
              style={{
                left: `${
                  (index * 29) %
                  100
                }%`,
                animationDelay: `${
                  (index % 12) *
                  0.08
                }s`,
                animationDuration: `${
                  2.4 +
                  (index % 5) *
                    0.35
                }s`,
                transform: `rotate(${
                  index * 37
                }deg)`,
              }}
            />
          ),
        )}
      </div>

      <div className="artist-results__container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="artist-results__header">

          <div className="artist-results__trophy">
            <Trophy
              size={23}
              strokeWidth={1.8}
            />
          </div>

          <p className="artist-results__eyebrow">
            ROUND COMPLETE
          </p>

          <h1>
            You know your music.
          </h1>

          <p>
            Let's see how quickly you
            recognized the artists.
          </p>

        </header>

        {/* =================================================
            SCORE
        ================================================= */}

        <section className="artist-results__hero">

          <div className="artist-results__hero-main">

            <span>
              FINAL SCORE
            </span>

            <strong>
              {score}
            </strong>

          </div>

          <div className="artist-results__accuracy">

            <span>
              BEST STREAK
            </span>

            <strong>
              {bestStreak}
            </strong>

          </div>

        </section>

        {/* =================================================
            RECOGNITION STATS
        ================================================= */}

        <section className="artist-results__hero">

          <div className="artist-results__hero-main">

            <span>
              ARTISTS RECOGNIZED
            </span>

            <strong>
              {recognizedCount}

              <small>
                /{results.length}
              </small>
            </strong>

          </div>

          <div className="artist-results__accuracy">

            <span>
              ACCURACY
            </span>

            <strong>
              {accuracy}%
            </strong>

          </div>

        </section>

        {/* =================================================
            SPEED
        ================================================= */}

        <section className="artist-results__speed">

          <div className="artist-results__section-heading">

            <p>
              RECOGNITION SPEED
            </p>

            <h2>
              How fast did you know?
            </h2>

          </div>

          <div className="artist-results__speed-grid">

            <div className="artist-results__speed-stat">

              <span>
                AVERAGE
              </span>

              <strong>
                {averageTime > 0
                  ? `${averageTime.toFixed(
                      1,
                    )}s`
                  : '—'}
              </strong>

            </div>

            <div className="artist-results__speed-stat artist-results__speed-stat--fastest">

              <span>
                FASTEST
              </span>

              <strong>
                {fastestTime > 0
                  ? `${fastestTime.toFixed(
                      1,
                    )}s`
                  : '—'}
              </strong>

              {fastestResult && (
                <small>
                  {
                    fastestResult.artist
                  }
                </small>
              )}

            </div>

          </div>

        </section>

        {/* =================================================
            BREAKDOWN
        ================================================= */}

        <section className="artist-results__breakdown">

          <div className="artist-results__section-heading">

            <p>
              ROUND RECAP
            </p>

            <h2>
              Your artists
            </h2>

          </div>

          <div className="artist-results__list">

            {results.map(
              (result) => (
                <div
                  key={`${result.questionNumber}-${result.title}`}
                  className={
                    result.correct
                      ? 'artist-results__item artist-results__item--correct'
                      : 'artist-results__item artist-results__item--missed'
                  }
                >

                  <div className="artist-results__number">
                    {String(
                      result.questionNumber,
                    ).padStart(
                      2,
                      '0',
                    )}
                  </div>

                  <div className="artist-results__artwork-wrapper">

                    {result.artworkUrl ? (
                      <img
                        src={
                          result.artworkUrl
                        }
                        alt=""
                        className="artist-results__artwork"
                      />
                    ) : (
                      <div className="artist-results__artwork artist-results__artwork--empty">
                        ?
                      </div>
                    )}

                  </div>

                  <div className="artist-results__song-info">

                    <strong>
                      {result.artist}
                    </strong>

                    <span>
                      {result.title}
                    </span>

                  </div>

                  <div className="artist-results__result-meta">

                    {result.correct ? (
                      <>
                        <span className="artist-results__time">
                          +{result.points} ·{' '}
                          {result.recognitionTime.toFixed(
                            1,
                          )}s
                        </span>

                        <Check
                          size={16}
                          strokeWidth={
                            2.5
                          }
                        />
                      </>
                    ) : (
                      <>
                        <span className="artist-results__missed-label">
                          MISSED
                        </span>

                        <X
                          size={16}
                          strokeWidth={
                            2.5
                          }
                        />
                      </>
                    )}

                  </div>

                </div>
              ),
            )}

          </div>

        </section>

        {/* =================================================
            FASTEST RECOGNITION
        ================================================= */}

        {fastestResult && (
          <section className="artist-results__fastest">

            <div className="artist-results__fastest-icon">
              <Trophy
                size={17}
              />
            </div>

            <div>

              <span>
                FASTEST RECOGNITION
              </span>

              <strong>
                {
                  fastestResult.artist
                }
              </strong>

              <p>
                Recognized in{' '}
                {fastestResult.recognitionTime.toFixed(
                  1,
                )}
                seconds.
              </p>

            </div>

          </section>
        )}

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="artist-results__actions">

          <button
            type="button"
            className="artist-results__play-again"
            onClick={
              onPlayAgain
            }
          >
            <RotateCcw
              size={16}
            />

            <span>
              PLAY AGAIN
            </span>
          </button>

          <button
            type="button"
            className="artist-results__back"
            onClick={
              onBackToPlay
            }
          >
            BACK TO PLAY
          </button>

        </div>

      </div>
    </div>
  )
}

export default ArtistGame
