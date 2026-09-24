import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import {
  Check,
  X,
  Play,
  Pause,
  Trophy,
} from 'lucide-react'

import {
  generateQuestion,
} from '../../services/gameService'

import type {
  Question,
} from '../../types/game'

import './PlayByArtist.css'


const TOTAL_QUESTIONS = 10
const RECOGNITION_TIME = 10


type LocationState = {
  artist?: string
}


type AnsweredSong = {
  question: Question
  answer: string | null
  correct: boolean
  timedOut: boolean
}


export default function PlayByArtist() {
  const navigate = useNavigate()
  const location = useLocation()

  const {
    artist: selectedArtist,
  } =
    (location.state as LocationState) ?? {}


  /*
   * ---------------------------------------------------------
   * GAME STATE
   * ---------------------------------------------------------
   */

  const [question, setQuestion] =
    useState<Question | null>(null)

  const [currentQuestion, setCurrentQuestion] =
    useState(0)

  const [loading, setLoading] =
    useState(true)

  const [loadingNext, setLoadingNext] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null)

  const [isPlaying, setIsPlaying] =
    useState(false)

  const [timeRemaining, setTimeRemaining] =
    useState(RECOGNITION_TIME)

  const [score, setScore] =
    useState(0)

  const [correctAnswers, setCorrectAnswers] =
    useState(0)

  const [bestStreak, setBestStreak] =
    useState(0)

  const [currentStreak, setCurrentStreak] =
    useState(0)

  const [totalListeningTime, setTotalListeningTime] =
    useState(0)

  const [showResults, setShowResults] =
    useState(false)

  const [answeredSongs, setAnsweredSongs] =
    useState<AnsweredSong[]>([])

  /*
   * ---------------------------------------------------------
   * REFS
   * ---------------------------------------------------------
   */

  const audioRef =
    useRef<HTMLAudioElement | null>(null)

  const timerRef =
    useRef<number | null>(null)

  const questionStartTimeRef =
    useRef<number | null>(null)

  const excludedTrackIdsRef =
    useRef<string[]>([])

  const scoreSubmittedRef =
    useRef(false)

  const initialLoadArtistRef =
    useRef<string | null>(null)

  const nextQuestionRef =
    useRef<Question | null>(null)

  const nextQuestionPromiseRef =
    useRef<Promise<Question | null> | null>(null)


  /*
   * ---------------------------------------------------------
   * FETCH QUESTION
   * ---------------------------------------------------------
   */

  const fetchQuestion =
    async (): Promise<Question | null> => {
      if (!selectedArtist) {
        return null
      }

      const nextQuestion =
        await generateQuestion(
          'name-the-song',
          'medium',
          undefined,
          excludedTrackIdsRef.current,
          undefined,
          selectedArtist,
        )

      const trackId =
        String(nextQuestion.song.id)

      if (
        !excludedTrackIdsRef.current.includes(
          trackId,
        )
      ) {
        excludedTrackIdsRef.current.push(
          trackId,
        )
      }

      return nextQuestion
    }


  /*
   * ---------------------------------------------------------
   * PRELOAD NEXT QUESTION
   * ---------------------------------------------------------
   */

  const preloadNextQuestion =
    (): Promise<Question | null> => {
      if (
        !selectedArtist ||
        nextQuestionRef.current
      ) {
        return Promise.resolve(
          nextQuestionRef.current,
        )
      }

      if (
        currentQuestion + 1 >=
        TOTAL_QUESTIONS
      ) {
        return Promise.resolve(null)
      }

      if (
        nextQuestionPromiseRef.current
      ) {
        return nextQuestionPromiseRef.current
      }

      const promise =
        (async () => {
          try {
            const preloadedQuestion =
              await fetchQuestion()

            nextQuestionRef.current =
              preloadedQuestion

            return preloadedQuestion
          } catch (err) {
            console.error(
              'Failed to preload next artist question:',
              err,
            )

            return null
          } finally {
            nextQuestionPromiseRef.current =
              null
          }
        })()

      nextQuestionPromiseRef.current =
        promise

      return promise
    }


  /*
   * ---------------------------------------------------------
   * LOAD INITIAL QUESTION
   * ---------------------------------------------------------
   */

  const loadInitialQuestion =
    async () => {
      if (!selectedArtist) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const firstQuestion =
          await fetchQuestion()

        if (!firstQuestion) {
          throw new Error(
            'Could not load the first question.',
          )
        }

        setQuestion(
          firstQuestion,
        )

        if (
          TOTAL_QUESTIONS > 1
        ) {
          void preloadNextQuestion()
        }
      } catch (err) {
        console.error(
          'Failed to load artist game:',
          err,
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Could not load the game.',
        )
      } finally {
        setLoading(false)
      }
    }


  /*
   * ---------------------------------------------------------
   * INITIAL LOAD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!selectedArtist) {
      setLoading(false)
      return
    }

    if (
      initialLoadArtistRef.current ===
      selectedArtist
    ) {
      return
    }

    initialLoadArtistRef.current =
      selectedArtist

    void loadInitialQuestion()
  }, [selectedArtist])


  /*
   * ---------------------------------------------------------
   * AUDIO
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!question) {
      return
    }

    const audio =
      new Audio(
        question.song.audioUrl,
      )

    audioRef.current =
      audio

    audio.preload =
      'auto'

    audio.onended = () => {
      setIsPlaying(false)
    }

    audio.onerror = () => {
      setIsPlaying(false)
    }

    /*
     * Attempt autoplay.
     * If the browser blocks autoplay, the player
     * can still start it with the play button.
     */
    void audio.play()
      .then(() => {
        setIsPlaying(true)
      })
      .catch(() => {
        setIsPlaying(false)
      })

    return () => {
      audio.pause()
      audio.currentTime = 0
      audio.onended = null
      audio.onerror = null

      if (
        audioRef.current ===
        audio
      ) {
        audioRef.current =
          null
      }
    }
  }, [question])


  /*
   * ---------------------------------------------------------
   * PLAY / PAUSE
   * ---------------------------------------------------------
   */

  const togglePlayback =
    () => {
      const audio =
        audioRef.current

      if (!audio) {
        return
      }

      if (audio.paused) {
        void audio.play()
          .then(() => {
            setIsPlaying(true)
          })
          .catch(() => {
            setIsPlaying(false)
          })
      } else {
        audio.pause()
        setIsPlaying(false)
      }
    }


  /*
   * ---------------------------------------------------------
   * LISTENING TIME
   * ---------------------------------------------------------
   */

  const recordListeningTime =
    () => {
      if (
        questionStartTimeRef.current ===
        null
      ) {
        return
      }

      const elapsed =
        Math.max(
          0,
          Math.round(
            (
              Date.now() -
              questionStartTimeRef.current
            ) / 1000,
          ),
        )

      setTotalListeningTime(
        previous =>
          previous + elapsed,
      )

      questionStartTimeRef.current =
        null
    }


  /*
   * ---------------------------------------------------------
   * SCORE
   * ---------------------------------------------------------
   */

  const calculatePoints =
    (
      timeLeft: number,
      streak: number,
    ) => {
      const basePoints =
        100

      const speedBonus =
        Math.round(
          (
            timeLeft /
            RECOGNITION_TIME
          ) * 100,
        )

      const streakBonus =
        streak * 25

      return (
        basePoints +
        speedBonus +
        streakBonus
      )
    }


  /*
   * ---------------------------------------------------------
   * TIMEOUT
   * ---------------------------------------------------------
   */

  const handleTimeout =
    () => {
      if (
        !question ||
        selectedAnswer !== null
      ) {
        return
      }

      recordListeningTime()

      if (
        timerRef.current !== null
      ) {
        window.clearInterval(
          timerRef.current,
        )

        timerRef.current =
          null
      }

      setTimeRemaining(0)

      setSelectedAnswer('')

      setCurrentStreak(0)

      setAnsweredSongs(
        previous => [
          ...previous,
          {
            question,
            answer: null,
            correct: false,
            timedOut: true,
          },
        ],
      )

      void preloadNextQuestion()
    }


  /*
   * ---------------------------------------------------------
   * TIMER
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (
      !question ||
      selectedAnswer !== null
    ) {
      return
    }

    setTimeRemaining(
      RECOGNITION_TIME,
    )

    questionStartTimeRef.current =
      Date.now()

    timerRef.current =
      window.setInterval(() => {
        setTimeRemaining(
          previous =>
            Math.max(
              0,
              previous - 1,
            ),
        )
      }, 1000)

    return () => {
      if (
        timerRef.current !== null
      ) {
        window.clearInterval(
          timerRef.current,
        )

        timerRef.current =
          null
      }
    }
  }, [question, selectedAnswer])


  /*
   * Resolve timeout outside the state updater.
   */

  useEffect(() => {
    if (
      timeRemaining !== 0 ||
      !question ||
      selectedAnswer !== null
    ) {
      return
    }

    handleTimeout()
  }, [
    timeRemaining,
    question,
    selectedAnswer,
  ])


  /*
   * ---------------------------------------------------------
   * SUBMIT FINAL SCORE
   * ---------------------------------------------------------
   */

  const submitFinalScore =
    () => {
      if (
        scoreSubmittedRef.current
      ) {
        return
      }

      scoreSubmittedRef.current =
        true

      const accuracy =
        TOTAL_QUESTIONS > 0
          ? Math.round(
              (
                correctAnswers /
                TOTAL_QUESTIONS
              ) * 100,
            )
          : 0

      void import(
        '../../services/scoreService',
      )
        .then(
          ({
            submitScore,
          }) =>
            submitScore({
              gameMode:
                'name-that-song',
              score,
              accuracy,
              bestStreak,
              questions:
                TOTAL_QUESTIONS,
              correctAnswers,
              totalListeningTime,
            }),
        )
        .catch(error => {
          console.error(
            'Failed to save score:',
            error,
          )
        })
    }


  /*
   * ---------------------------------------------------------
   * ANSWER
   * ---------------------------------------------------------
   */

  const handleAnswer =
    (
      answer: string,
    ) => {
      if (
        !question ||
        selectedAnswer !== null
      ) {
        return
      }

      recordListeningTime()

      if (
        timerRef.current !== null
      ) {
        window.clearInterval(
          timerRef.current,
        )

        timerRef.current =
          null
      }

      if (
        audioRef.current
      ) {
        audioRef.current.pause()
        setIsPlaying(false)
      }

      const isCorrect =
        answer ===
        question.correctAnswer

      setSelectedAnswer(
        answer,
      )

      setAnsweredSongs(
        previous => [
          ...previous,
          {
            question,
            answer,
            correct: isCorrect,
            timedOut: false,
          },
        ],
      )

      if (isCorrect) {
        const newStreak =
          currentStreak + 1

        const points =
          calculatePoints(
            timeRemaining,
            newStreak,
          )

        setScore(
          previous =>
            previous + points,
        )

        setCorrectAnswers(
          previous =>
            previous + 1,
        )

        setCurrentStreak(
          newStreak,
        )

        setBestStreak(
          previous =>
            Math.max(
              previous,
              newStreak,
            ),
        )
      } else {
        setCurrentStreak(0)
      }

      void preloadNextQuestion()
    }


  /*
   * ---------------------------------------------------------
   * NEXT QUESTION
   * ---------------------------------------------------------
   */

  const handleNextQuestion =
    async () => {
      if (
        currentQuestion + 1 >=
        TOTAL_QUESTIONS
      ) {
        submitFinalScore()
        setShowResults(true)
        return
      }

      setLoadingNext(true)
      setError(null)

      try {
        let upcomingQuestion =
          nextQuestionRef.current

        if (
          !upcomingQuestion &&
          nextQuestionPromiseRef.current
        ) {
          upcomingQuestion =
            await nextQuestionPromiseRef.current
        }

        if (!upcomingQuestion) {
          upcomingQuestion =
            await fetchQuestion()
        }

        if (!upcomingQuestion) {
          throw new Error(
            'Could not load the next song.',
          )
        }

        nextQuestionRef.current =
          null

        setQuestion(
          upcomingQuestion,
        )

        setCurrentQuestion(
          previous =>
            previous + 1,
        )

        setSelectedAnswer(
          null,
        )

        setTimeRemaining(
          RECOGNITION_TIME,
        )

        setIsPlaying(false)

        void preloadNextQuestion()
      } catch (err) {
        console.error(
          'Failed to load next artist question:',
          err,
        )

        setError(
          err instanceof Error
            ? err.message
            : 'Could not load the next question.',
        )
      } finally {
        setLoadingNext(false)
      }
    }


  /*
   * ---------------------------------------------------------
   * EXIT
   * ---------------------------------------------------------
   */

  const handleExit =
    () => {
      if (
        audioRef.current
      ) {
        audioRef.current.pause()
      }

      if (
        timerRef.current !== null
      ) {
        window.clearInterval(
          timerRef.current,
        )

        timerRef.current =
          null
      }

      navigate('/play')
    }


  /*
   * ---------------------------------------------------------
   * RESULTS
   * ---------------------------------------------------------
   */

  if (showResults) {
    const accuracy =
      TOTAL_QUESTIONS > 0
        ? Math.round(
            (
              correctAnswers /
              TOTAL_QUESTIONS
            ) * 100,
          )
        : 0

    const fastestSong =
      answeredSongs
        .filter(song => !song.timedOut)
        .at(0)

    return (
      <main className="play-by-artist-results">
        <div className="play-by-artist-results__container">

          <section className="play-by-artist-results__hero">
            <div className="play-by-artist-results__trophy">
              <Trophy size={30} />
            </div>

            <p className="play-by-artist-results__eyebrow">
              PLAY BY ARTIST
            </p>

            <h1 className="play-by-artist-results__title">
              {selectedArtist}
            </h1>

            <p className="play-by-artist-results__subtitle">
              You finished all {TOTAL_QUESTIONS} songs.
            </p>
          </section>


          <section className="play-by-artist-results__score-card">
            <span className="play-by-artist-results__score-label">
              FINAL SCORE
            </span>

            <strong className="play-by-artist-results__score">
              {score}
            </strong>
          </section>


          <section className="play-by-artist-results__stats">
            <div className="play-by-artist-results__stat">
              <span>CORRECT</span>
              <strong>
                {correctAnswers}/{TOTAL_QUESTIONS}
              </strong>
            </div>

            <div className="play-by-artist-results__stat">
              <span>ACCURACY</span>
              <strong>
                {accuracy}%
              </strong>
            </div>

            <div className="play-by-artist-results__stat">
              <span>BEST STREAK</span>
              <strong>
                {bestStreak}
              </strong>
            </div>

            <div className="play-by-artist-results__stat">
              <span>LISTENING</span>
              <strong>
                {totalListeningTime}s
              </strong>
            </div>
          </section>


          {fastestSong && (
            <section className="play-by-artist-results__fastest">
              <div>
                <span className="play-by-artist-results__fastest-label">
                  YOU KNEW THIS ONE
                </span>

                <strong>
                  {fastestSong.question.song.title}
                </strong>

                <small>
                  {selectedArtist}
                </small>
              </div>
            </section>
          )}


          <section className="play-by-artist-results__songs">
            <div className="play-by-artist-results__section-header">
              <h2>
                Songs Played
              </h2>

              <span>
                {answeredSongs.length} songs
              </span>
            </div>

            <div className="play-by-artist-results__song-list">
              {answeredSongs.map(
                (item, index) => (
                  <div
                    key={`${item.question.song.id}-${index}`}
                    className={
                      `play-by-artist-results__song ${
                        item.correct
                          ? 'is-correct'
                          : 'is-incorrect'
                      }`
                    }
                  >
                    <span className="play-by-artist-results__song-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className="play-by-artist-results__song-info">
                      <strong>
                        {item.question.song.title}
                      </strong>

                      <span>
                        {item.question.song.album}
                      </span>
                    </div>

                    <div className="play-by-artist-results__song-result">
                      {item.correct ? (
                        <>
                          <Check size={15} />
                          Correct
                        </>
                      ) : (
                        <>
                          <X size={15} />
                          {item.timedOut
                            ? 'Timed out'
                            : 'Incorrect'}
                        </>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>


          <div className="play-by-artist-results__actions">
            <button
              className="play-by-artist-results__secondary-button"
              onClick={() =>
                navigate('/play')
              }
            >
              BACK TO PLAY
            </button>

            <button
              className="play-by-artist-results__primary-button"
              onClick={() =>
                window.location.reload()
              }
            >
              PLAY AGAIN
            </button>
          </div>

        </div>
      </main>
    )
  }


  /*
   * ---------------------------------------------------------
   * NO ARTIST
   * ---------------------------------------------------------
   */

  if (!selectedArtist) {
    return (
      <main className="play-by-artist__error-page">
        <div className="play-by-artist__error-card">
          <h1>No artist selected</h1>

          <p>
            Choose an artist before starting
            the game.
          </p>

          <button
            onClick={() =>
              navigate('/play')
            }
          >
            Back to Play
          </button>
        </div>
      </main>
    )
  }


  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (
    loading &&
    !question
  ) {
    return (
      <main className="play-by-artist__loading-page">
        <div className="play-by-artist__loading-content">
          <div className="play-by-artist__loading-spinner" />

          <p>
            Loading {selectedArtist}...
          </p>
        </div>
      </main>
    )
  }


  /*
   * ---------------------------------------------------------
   * ERROR
   * ---------------------------------------------------------
   */

  if (
    error &&
    !question
  ) {
    return (
      <main className="play-by-artist__error-page">
        <div className="play-by-artist__error-card">
          <h1>
            Something went wrong
          </h1>

          <p>
            {error}
          </p>

          <button
            onClick={() =>
              navigate('/play')
            }
          >
            Back to Play
          </button>
        </div>
      </main>
    )
  }


  if (!question) {
    return null
  }


  const isAnswered =
    selectedAnswer !== null

  const isCorrect =
    selectedAnswer ===
    question.correctAnswer


  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <main className="play-by-artist">
      <div className="play-by-artist__container">

        <header className="play-by-artist__header">

          <div className="play-by-artist__header-main">
            <p className="play-by-artist__eyebrow">
              PLAY BY ARTIST
            </p>

            <h1 className="play-by-artist__title">
              Name That Song
            </h1>

            <div className="play-by-artist__artist-badge">
              <span>ARTIST</span>

              <strong>
                {selectedArtist}
              </strong>
            </div>
          </div>


          <div className="play-by-artist__header-right">

            <div className="play-by-artist__streak">
              <span>STREAK</span>

              <strong>
                {currentStreak}
              </strong>
            </div>

            <div className="play-by-artist__round">
              <span>ROUND</span>

              <strong>
                {currentQuestion + 1}
                {' / '}
                {TOTAL_QUESTIONS}
              </strong>
            </div>

          </div>

        </header>


        <div className="play-by-artist__progress">
          <div
            className="play-by-artist__progress-bar"
            style={{
              width: `${
                (
                  timeRemaining /
                  RECOGNITION_TIME
                ) * 100
              }%`,
            }}
          />
        </div>


        <section className="play-by-artist__board">

          <div className="play-by-artist__question-panel">

            <div className="play-by-artist__question-header">
              <span>
                IDENTIFY THE SONG
              </span>

              <span
                className={
                  `play-by-artist__timer ${
                    timeRemaining <= 3
                      ? 'is-danger'
                      : ''
                  }`
                }
              >
                {timeRemaining}s
              </span>
            </div>


            <div className="play-by-artist__question-content">

              {!isAnswered ? (
                <>
                  <div className="play-by-artist__question-mark">
                    ?
                  </div>

                  <p className="play-by-artist__question-eyebrow">
                    WHICH SONG IS THIS?
                  </p>

                  <h2>
                    Can you recognize
                    <span>
                      {' '}
                      {selectedArtist}
                    </span>
                    ?
                  </h2>

                  <p className="play-by-artist__instruction">
                    Listen to the preview and choose
                    the correct song title.
                  </p>
                </>
              ) : (
                <>
                  <div
                    className={
                      `play-by-artist__result-icon ${
                        isCorrect
                          ? 'is-correct'
                          : 'is-incorrect'
                      }`
                    }
                  >
                    {isCorrect ? (
                      <Check size={28} />
                    ) : (
                      <X size={28} />
                    )}
                  </div>

                  <p className="play-by-artist__question-eyebrow">
                    {isCorrect
                      ? 'CORRECT'
                      : selectedAnswer === ''
                        ? 'TIME’S UP'
                        : 'INCORRECT'}
                  </p>

                  <h2 className="play-by-artist__revealed-title">
                    {question.correctAnswer}
                  </h2>

                  <p className="play-by-artist__revealed-artist">
                    {selectedArtist}
                  </p>

                  <p className="play-by-artist__revealed-album">
                    {question.song.album}
                  </p>

                  <img
                    src={
                      question.song.artworkUrl
                    }
                    alt={
                      question.song.album
                    }
                    className="play-by-artist__artwork"
                  />
                </>
              )}

            </div>


            <div className="play-by-artist__audio">

              <button
                className="play-by-artist__play-button"
                onClick={
                  togglePlayback
                }
                aria-label={
                  isPlaying
                    ? 'Pause preview'
                    : 'Play preview'
                }
                disabled={
                  !question.song.audioUrl
                }
              >
                {isPlaying ? (
                  <Pause size={24} />
                ) : (
                  <Play size={24} />
                )}
              </button>


              <div className="play-by-artist__waveform">
                {Array.from(
                  { length: 28 },
                  (_, index) => (
                    <span
                      key={index}
                      style={{
                        height: `${
                          20 +
                          (
                            (
                              index * 17
                            ) % 19
                          )
                        }%`,
                      }}
                    />
                  ),
                )}
              </div>

            </div>

          </div>


          <aside className="play-by-artist__answers-panel">

            <div className="play-by-artist__answers-header">
              <span className="play-by-artist__answers-eyebrow">
                CHOOSE THE SONG
              </span>

              <span>
                {question.answers.length} OPTIONS
              </span>
            </div>


            <div className="play-by-artist__answers">

              {question.answers.map(
                (
                  answer,
                  index,
                ) => {
                  const answerIsCorrect =
                    answer ===
                    question.correctAnswer

                  const answerWasSelected =
                    answer ===
                    selectedAnswer

                  let className =
                    'play-by-artist__answer'

                  if (isAnswered) {
                    if (
                      answerIsCorrect
                    ) {
                      className +=
                        ' is-correct'
                    } else if (
                      answerWasSelected
                    ) {
                      className +=
                        ' is-incorrect'
                    } else {
                      className +=
                        ' is-disabled'
                    }
                  }

                  return (
                    <button
                      key={answer}
                      className={
                        className
                      }
                      onClick={() =>
                        handleAnswer(
                          answer,
                        )
                      }
                      disabled={
                        isAnswered ||
                        loadingNext
                      }
                    >
                      <span className="play-by-artist__answer-letter">
                        {String.fromCharCode(
                          65 + index,
                        )}
                      </span>

                      <span className="play-by-artist__answer-text">
                        {answer}
                      </span>

                      {isAnswered &&
                        answerIsCorrect && (
                          <Check
                            size={18}
                          />
                        )}

                      {isAnswered &&
                        answerWasSelected &&
                        !answerIsCorrect && (
                          <X
                            size={18}
                          />
                        )}
                    </button>
                  )
                },
              )}

            </div>


            {!isAnswered && (
              <p className="play-by-artist__play-hint">
                Press play to hear the song preview.
              </p>
            )}


            {error && (
              <div className="inline-error">
                {error}
              </div>
            )}


            {isAnswered && (
              <div className="play-by-artist__next-wrapper">

                <button
                  className="play-by-artist__next-button"
                  onClick={
                    handleNextQuestion
                  }
                  disabled={
                    loadingNext
                  }
                >
                  {loadingNext ? (
                    <>
                      <span className="play-by-artist__button-spinner" />
                      LOADING...
                    </>
                  ) : (
                    currentQuestion + 1 >=
                    TOTAL_QUESTIONS
                      ? 'SEE RESULTS'
                      : 'NEXT SONG'
                  )}
                </button>

              </div>
            )}

          </aside>

        </section>


        <footer className="play-by-artist__footer">
          <span>
            {score} POINTS
          </span>

          <span>
            {correctAnswers} CORRECT
          </span>

          <button
            onClick={handleExit}
            style={{
              border: 0,
              background: 'none',
              color: 'inherit',
              font: 'inherit',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            EXIT GAME
          </button>
        </footer>

      </div>
    </main>
  )
}

