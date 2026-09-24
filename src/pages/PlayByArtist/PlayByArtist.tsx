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

import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import {
  generateQuestion,
} from '../../services/gameService'

import {
  submitScore,
} from '../../services/scoreService'

import {
  calculateFinalPoints,
} from '../../lib/gameScoring'

import type {
  Question,
} from '../../types/game'

import './PlayByArtist.css'

const ROUND_LENGTH = 10
const QUESTION_TIME = 10
const TOTAL_QUESTIONS = 10

type PlayByArtistLocationState = {
  artist?: string
}

type AnswerStatus =
  | 'idle'
  | 'correct'
  | 'incorrect'
  | 'timeout'

type PlayByArtistResult = {
  questionNumber: number
  title: string
  artist: string
  album: string
  artworkUrl: string
  recognitionTime: number
  correct: boolean
  points: number
}

function PlayByArtist() {
  const location = useLocation()
  const navigate = useNavigate()

  const selectedArtist =
    (
      location.state as
        | PlayByArtistLocationState
        | null
        | undefined
    )?.artist

  /*
   * --------------------------------------------------
   * QUESTION STATE
   * --------------------------------------------------
   */

  const [
    questions,
    setQuestions,
  ] = useState<Question[]>([])

  const [
    currentQuestion,
    setCurrentQuestion,
  ] = useState(0)

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    isLoadingNext,
    setIsLoadingNext,
  ] = useState(false)

  /*
   * --------------------------------------------------
   * ANSWER STATE
   * --------------------------------------------------
   */

  const [
    selectedAnswer,
    setSelectedAnswer,
  ] = useState<string | null>(null)

  const [
    answerStatus,
    setAnswerStatus,
  ] = useState<AnswerStatus>('idle')

  /*
   * --------------------------------------------------
   * TIMER / AUDIO STATE
   * --------------------------------------------------
   */

  const [
    timeRemaining,
    setTimeRemaining,
  ] = useState(QUESTION_TIME)

  const [
    isPlaying,
    setIsPlaying,
  ] = useState(false)

  /*
   * --------------------------------------------------
   * SCORE STATE
   * --------------------------------------------------
   */

  const [
    score,
    setScore,
  ] = useState(0)

  const [
    streak,
    setStreak,
  ] = useState(0)

  const [
    bestStreak,
    setBestStreak,
  ] = useState(0)

  /*
   * --------------------------------------------------
   * RESULTS STATE
   * --------------------------------------------------
   */

  const [
    recognitionResults,
    setRecognitionResults,
  ] = useState<PlayByArtistResult[]>([])

  const [
    isGameComplete,
    setIsGameComplete,
  ] = useState(false)

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
    if (!selectedArtist) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    async function loadFirstQuestion() {
      setIsLoading(true)

      try {
        const firstQuestion =
          await generateQuestion(
            'name-the-song',
            'medium',
            undefined,
            [],
            undefined,
            selectedArtist,
          )

        if (!isMounted) {
          return
        }

        setQuestions([firstQuestion])
        setIsLoading(false)
      } catch (error) {
        console.error(
          'Failed to generate Play by Artist question:',
          error,
        )

        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadFirstQuestion()

    return () => {
      isMounted = false
    }
  }, [selectedArtist])

  /*
   * --------------------------------------------------
   * PRELOAD NEXT QUESTION
   * --------------------------------------------------
   */

  useEffect(() => {
    if (
      !selectedArtist ||
      questions.length === 0 ||
      questions.length >= TOTAL_QUESTIONS
    ) {
      return
    }

    const nextIndex =
      questions.length

    let isMounted = true

    async function preloadNextQuestion() {
      try {
        const nextQuestion =
          await generateQuestion(
            'name-the-song',
            'medium',
            undefined,
            questions.map(
              question =>
                question.song.id,
            ),
            undefined,
            selectedArtist,
          )

        if (!isMounted) {
          return
        }

        setQuestions(current => {
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
          'Failed to preload Play by Artist question:',
          error,
        )
      }
    }

    void preloadNextQuestion()

    return () => {
      isMounted = false
    }
  }, [
    questions,
    selectedArtist,
  ])

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
        result =>
          result.correct,
      ).length

    const accuracy =
      TOTAL_QUESTIONS > 0
        ? (
            correctAnswers /
            TOTAL_QUESTIONS
          ) * 100
        : 0

    const totalListeningTime =
      recognitionResults.reduce(
        (
          total,
          result,
        ) =>
          total +
          result.recognitionTime,
        0,
      )

    async function saveScore() {
      try {
        await submitScore({
          gameMode:
            'name-that-song',

          score,

          accuracy,

          bestStreak,

          questions:
            TOTAL_QUESTIONS,

          correctAnswers,

          totalListeningTime,
        })

        console.log(
          'PLAY BY ARTIST SCORE SAVED:',
          {
            artist:
              selectedArtist,

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
          'FAILED TO SAVE PLAY BY ARTIST SCORE:',
          error,
        )
      }
    }

    void saveScore()
  }, [
    isGameComplete,
    recognitionResults,
    score,
    bestStreak,
    selectedArtist,
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
      QUESTION_TIME,
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
          current => {
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
                currentResults => [
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
                      QUESTION_TIME,

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
        QUESTION_TIME,
        Math.max(
          0,
          QUESTION_TIME -
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

    setStreak(
      nextStreak,
    )

    if (isCorrect) {
      setBestStreak(
        currentBest =>
          Math.max(
            currentBest,
            nextStreak,
          ),
      )
    }

    setScore(
      currentScore =>
        currentScore +
        earnedPoints,
    )

    if (audioRef.current) {
      audioRef.current.pause()
    }

    setRecognitionResults(
      currentResults => [
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
            question.song
              .artworkUrl ?? '',

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

    if (!selectedArtist) {
      return
    }

    setIsLoadingNext(true)

    try {
      const nextQuestion =
        await generateQuestion(
          'name-the-song',
          'medium',
          undefined,
          questions.map(
            current =>
              current.song.id,
          ),
          undefined,
          selectedArtist,
        )

      setQuestions(
        current => [
          ...current,
          nextQuestion,
        ],
      )

      setCurrentQuestion(
        nextIndex,
      )
    } catch (error) {
      console.error(
        'Failed to generate next Play by Artist question:',
        error,
      )
    } finally {
      setIsLoadingNext(false)
    }
  }

  /*
   * --------------------------------------------------
   * PLAY AGAIN
   * --------------------------------------------------
   */

  function handlePlayAgain() {
    window.location.reload()
  }

  /*
   * --------------------------------------------------
   * BACK TO PLAY
   * --------------------------------------------------
   */

  function handleBackToPlay() {
    navigate('/play')
  }

  /*
   * --------------------------------------------------
   * NO ARTIST
   * --------------------------------------------------
   */

  if (!selectedArtist) {
    return (
      <div className="play-by-artist">
        <div className="play-by-artist__container">
          <main className="play-by-artist__error">
            <p className="play-by-artist__eyebrow">
              PLAY BY ARTIST
            </p>

            <h1>
              NO ARTIST SELECTED
            </h1>

            <p>
              Choose an artist before
              starting the game.
            </p>

            <button
              type="button"
              className="play-by-artist__back-button"
              onClick={
                handleBackToPlay
              }
            >
              BACK TO PLAY
            </button>
          </main>
        </div>
      </div>
    )
  }

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (isLoading) {
    return (
      <div className="play-by-artist">
        <div className="play-by-artist__container">
          <main className="play-by-artist__loading">
            <p className="play-by-artist__eyebrow">
              PLAY BY ARTIST
            </p>

            <h1>
              GETTING {selectedArtist.toUpperCase()}{' '}
              READY
            </h1>

            <p>
              Finding a song from{' '}
              {selectedArtist}...
            </p>
          </main>
        </div>
      </div>
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
      <div className="play-by-artist">
        <div className="play-by-artist__container">
          <main className="play-by-artist__error">
            <p className="play-by-artist__eyebrow">
              PLAY BY ARTIST
            </p>

            <h1>
              NO SONG AVAILABLE
            </h1>

            <p>
              We couldn't generate a{' '}
              {selectedArtist} song
              right now.
            </p>

            <button
              type="button"
              className="play-by-artist__back-button"
              onClick={
                handleBackToPlay
              }
            >
              BACK TO PLAY
            </button>
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
      <PlayByArtistResultsScreen
        artist={selectedArtist}
        results={
          recognitionResults
        }
        score={score}
        bestStreak={
          bestStreak
        }
        onPlayAgain={
          handlePlayAgain
        }
        onBackToPlay={
          handleBackToPlay
        }
      />
    )
  }

  const progress =
    ((QUESTION_TIME -
      timeRemaining) /
      QUESTION_TIME) *
    100

  const isRevealed =
    answerStatus !== 'idle'

  const isCorrect =
    answerStatus === 'correct'

  return (
    <div className="play-by-artist">
      <div className="play-by-artist__container">

        <header className="play-by-artist__header">
          <div>
            <p className="play-by-artist__eyebrow">
              PLAY BY ARTIST
            </p>

            <h1 className="play-by-artist__title">
              {selectedArtist}
            </h1>

            <p className="play-by-artist__subtitle">
              Guess the song from this
              artist.
            </p>
          </div>

          <div className="play-by-artist__round">
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

        <main className="play-by-artist__board">

          <section className="play-by-artist__question">

            {!isRevealed ? (
              <>
                <div className="play-by-artist__artist-badge">
                  <span>
                    YOU CHOSE
                  </span>

                  <strong>
                    {selectedArtist}
                  </strong>
                </div>

                <p className="play-by-artist__prompt">
                  WHICH SONG IS THIS?
                </p>

                <h2>
                  Which song by{' '}
                  {selectedArtist} are
                  you hearing?
                </h2>
              </>
            ) : (
              <>
                {question.song
                  .artworkUrl ? (
                  <img
                    src={
                      question.song
                        .artworkUrl
                    }
                    alt={`${question.song.album} album cover`}
                    className="play-by-artist__artwork"
                  />
                ) : (
                  <div className="play-by-artist__artwork-placeholder">
                    <span>♪</span>
                  </div>
                )}

                <p className="play-by-artist__prompt">
                  SONG REVEALED
                </p>

                <h2>
                  {question.song.title}
                </h2>
              </>
            )}

            <section className="play-by-artist__audio">

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

              <div className="play-by-artist__audio-top">
                <span>
                  10 SECOND SNIPPET
                </span>

                <strong
                  className={
                    timeRemaining <=
                      3 &&
                    !isRevealed
                      ? 'play-by-artist__timer play-by-artist__timer--urgent'
                      : 'play-by-artist__timer'
                  }
                >
                  {timeRemaining.toFixed(
                    1,
                  )}
                  s
                </strong>
              </div>

              <div className="play-by-artist__player">

                <button
                  type="button"
                  className="play-by-artist__play"
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

                <div className="play-by-artist__wave">
                  {Array.from({
                    length: 32,
                  }).map(
                    (_, index) => (
                      <span
                        key={index}
                        className={
                          isPlaying
                            ? 'play-by-artist__wave-bar play-by-artist__wave-bar--playing'
                            : 'play-by-artist__wave-bar'
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

              <div className="play-by-artist__progress">
                <div
                  className="play-by-artist__progress-fill"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <p className="play-by-artist__hint">
                {isRevealed
                  ? 'The answer has been revealed.'
                  : `Pick the ${selectedArtist} song as soon as you know it.`}
              </p>

            </section>

          </section>

          <section className="play-by-artist__play-panel">

            {!isRevealed ? (
              <section className="play-by-artist__answers">

                <div className="play-by-artist__answers-header">
                  <span>
                    CHOOSE THE SONG
                  </span>

                  <span>
                    4 OPTIONS
                  </span>
                </div>

                <div className="play-by-artist__answer-grid">
                  {question.answers.map(
                    (
                      answer,
                      index,
                    ) => {
                      const isAnswerCorrect =
                        answer ===
                        question.correctAnswer

                      const isAnswerSelected =
                        answer ===
                        selectedAnswer

                      let className =
                        'play-by-artist__answer'

                      if (
                        isRevealed
                      ) {
                        if (
                          isAnswerCorrect
                        ) {
                          className +=
                            ' play-by-artist__answer--correct'
                        } else if (
                          isAnswerSelected
                        ) {
                          className +=
                            ' play-by-artist__answer--incorrect'
                        }
                      }

                      return (
                        <button
                          key={
                            answer
                          }
                          type="button"
                          className={
                            className
                          }
                          onClick={() =>
                            handleAnswer(
                              answer,
                            )
                          }
                        >
                          <span className="play-by-artist__answer-number">
                            {String(
                              index +
                                1,
                            ).padStart(
                              2,
                              '0',
                            )}
                          </span>

                          <span>
                            {answer}
                          </span>
                        </button>
                      )
                    },
                  )}
                </div>

              </section>
            ) : (
              <section className="play-by-artist__reveal">

                <div
                  className={
                    isCorrect
                      ? 'play-by-artist__result play-by-artist__result--correct'
                      : 'play-by-artist__result play-by-artist__result--incorrect'
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
                      ? `The song was "${question.correctAnswer}".`
                      : isCorrect
                        ? 'You got it.'
                        : `The song was "${question.correctAnswer}".`}
                  </strong>
                </div>

                <div className="play-by-artist__song-card">

                  {question.song
                    .artworkUrl ? (
                    <img
                      src={
                        question.song
                          .artworkUrl
                      }
                      alt={`${question.song.album} album cover`}
                      className="play-by-artist__artwork"
                    />
                  ) : (
                    <div className="play-by-artist__artwork-placeholder">
                      <span>♪</span>
                    </div>
                  )}

                  <div className="play-by-artist__song-info">

                    <p className="play-by-artist__song-label">
                      YOU WERE LISTENING TO
                    </p>

                    <h3>
                      {question.song.title}
                    </h3>

                    <p className="play-by-artist__artist">
                      {question.song.artist}
                    </p>

                    <p className="play-by-artist__album">
                      {question.song.album}
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  className="play-by-artist__next"
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
 * PLAY BY ARTIST RESULTS
 * ==================================================
 */

type PlayByArtistResultsScreenProps = {
  artist: string
  results: PlayByArtistResult[]
  score: number
  bestStreak: number
  onPlayAgain: () => void
  onBackToPlay: () => void
}

function PlayByArtistResultsScreen({
  artist,
  results,
  score,
  bestStreak,
  onPlayAgain,
  onBackToPlay,
}: PlayByArtistResultsScreenProps) {
  const correctResults =
    results.filter(
      result => result.correct,
    )

  const recognizedCount =
    correctResults.length

  const accuracy =
    results.length > 0
      ? Math.round(
          (
            recognizedCount /
            results.length
          ) * 100,
        )
      : 0

  const recognitionTimes =
    correctResults.map(
      result =>
        result.recognitionTime,
    )

  const averageTime =
    recognitionTimes.length > 0
      ? recognitionTimes.reduce(
          (
            total,
            time,
          ) =>
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
      result =>
        result.recognitionTime ===
        fastestTime,
    )

  const confettiPieces =
    Array.from({
      length: 36,
    })

  return (
    <div className="play-by-artist-results">

      <div
        className="play-by-artist-results__confetti"
        aria-hidden="true"
      >
        {confettiPieces.map(
          (_, index) => (
            <span
              key={index}
              className="play-by-artist-results__confetti-piece"
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

      <div className="play-by-artist-results__container">

        <header className="play-by-artist-results__header">

          <div className="play-by-artist-results__trophy">
            <Trophy
              size={23}
              strokeWidth={1.8}
            />
          </div>

          <p className="play-by-artist-results__eyebrow">
            {artist}
          </p>

          <h1>
            Round Complete
          </h1>

          <p>
            How well did you know{' '}
            {artist}'s songs?
          </p>

        </header>

        <section className="play-by-artist-results__hero">

          <div className="play-by-artist-results__hero-main">
            <span>
              FINAL SCORE
            </span>

            <strong>
              {score}
            </strong>
          </div>

          <div className="play-by-artist-results__accuracy">
            <span>
              BEST STREAK
            </span>

            <strong>
              {bestStreak}
            </strong>
          </div>

        </section>

        <section className="play-by-artist-results__hero">

          <div className="play-by-artist-results__hero-main">
            <span>
              SONGS RECOGNIZED
            </span>

            <strong>
              {recognizedCount}
              <small>
                /{results.length}
              </small>
            </strong>
          </div>

          <div className="play-by-artist-results__accuracy">
            <span>
              ACCURACY
            </span>

            <strong>
              {accuracy}%
            </strong>
          </div>

        </section>

        <section className="play-by-artist-results__speed">

          <div className="play-by-artist-results__section-heading">
            <p>
              RECOGNITION SPEED
            </p>

            <h2>
              How fast did you know?
            </h2>
          </div>

          <div className="play-by-artist-results__speed-grid">

            <div className="play-by-artist-results__speed-stat">

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

            <div className="play-by-artist-results__speed-stat play-by-artist-results__speed-stat--fastest">

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
                  {fastestResult.title}
                </small>
              )}

            </div>

          </div>

        </section>

        <section className="play-by-artist-results__breakdown">

          <div className="play-by-artist-results__section-heading">

            <p>
              ROUND RECAP
            </p>

            <h2>
              {artist} songs
            </h2>

          </div>

          <div className="play-by-artist-results__list">

            {results.map(
              result => (
                <div
                  key={`${result.questionNumber}-${result.title}`}
                  className={
                    result.correct
                      ? 'play-by-artist-results__item play-by-artist-results__item--correct'
                      : 'play-by-artist-results__item play-by-artist-results__item--missed'
                  }
                >

                  <div className="play-by-artist-results__number">
                    {String(
                      result.questionNumber,
                    ).padStart(
                      2,
                      '0',
                    )}
                  </div>

                  <div className="play-by-artist-results__artwork-wrapper">

                    {result.artworkUrl ? (
                      <img
                        src={
                          result.artworkUrl
                        }
                        alt=""
                        className="play-by-artist-results__artwork"
                      />
                    ) : (
                      <div className="play-by-artist-results__artwork play-by-artist-results__artwork--empty">
                        ?
                      </div>
                    )}

                  </div>

                  <div className="play-by-artist-results__song-info">

                    <strong>
                      {result.title}
                    </strong>

                    <span>
                      {result.artist}
                    </span>

                  </div>

                  <div className="play-by-artist-results__result-meta">

                    {result.correct ? (
                      <>
                        <span className="play-by-artist-results__time">
                          +{result.points} ·{' '}
                          {result.recognitionTime.toFixed(
                            1,
                          )}s
                        </span>

                        <Check
                          size={16}
                          strokeWidth={2.5}
                        />
                      </>
                    ) : (
                      <>
                        <span className="play-by-artist-results__missed-label">
                          MISSED
                        </span>

                        <X
                          size={16}
                          strokeWidth={2.5}
                        />
                      </>
                    )}

                  </div>

                </div>
              ),
            )}

          </div>

        </section>

        {fastestResult && (
          <section className="play-by-artist-results__fastest">

            <div className="play-by-artist-results__fastest-icon">
              <Trophy
                size={17}
              />
            </div>

            <div>

              <span>
                FASTEST RECOGNITION
              </span>

              <strong>
                {fastestResult.title}
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

        <div className="play-by-artist-results__actions">

          <button
            type="button"
            className="play-by-artist-results__play-again"
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
            className="play-by-artist-results__back"
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

export default PlayByArtist

