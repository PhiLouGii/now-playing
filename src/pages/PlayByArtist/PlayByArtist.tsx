import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Clock,
  Pause,
  Play,
  Trophy,
  X,
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
  artistId?: string
}


type AnsweredSong = {
  question: Question
  answer: string | null
  correct: boolean
  timedOut: boolean
  recognitionTime: number
  points: number
}


function calculateArtistPoints(
  timeRemaining: number,
  streak: number,
): number {
  return Math.round(
    (timeRemaining /
      RECOGNITION_TIME) *
      100 *
      (1 + streak * 0.1),
  )
}


export default function PlayByArtist() {
  const navigate =
    useNavigate()

  const location =
    useLocation()

  const {
    artist: selectedArtist,
    artistId: selectedArtistId,
  } =
    (location.state as LocationState) ??
    {}


  const [
    question,
    setQuestion,
  ] =
    useState<Question | null>(
      null,
    )

  const [
    currentQuestion,
    setCurrentQuestion,
  ] =
    useState(1)

  const [
    loading,
    setLoading,
  ] =
    useState(true)

  const [
    loadingNext,
    setLoadingNext,
  ] =
    useState(false)

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    )

  const [
    selectedAnswer,
    setSelectedAnswer,
  ] =
    useState<string | null>(
      null,
    )

  const [
    isPlaying,
    setIsPlaying,
  ] =
    useState(false)

  const [
    timeRemaining,
    setTimeRemaining,
  ] =
    useState(
      RECOGNITION_TIME,
    )

  const [
    score,
    setScore,
  ] =
    useState(0)

  const [
    correctAnswers,
    setCorrectAnswers,
  ] =
    useState(0)

  const [
    bestStreak,
    setBestStreak,
  ] =
    useState(0)

  const [
    currentStreak,
    setCurrentStreak,
  ] =
    useState(0)

  const [
    totalListeningTime,
    setTotalListeningTime,
  ] =
    useState(0)

  const [
    showResults,
    setShowResults,
  ] =
    useState(false)

  const [
    answeredSongs,
    setAnsweredSongs,
  ] =
    useState<AnsweredSong[]>([])


  const audioRef =
    useRef<HTMLAudioElement | null>(
      null,
    )

  const timerRef =
    useRef<number | null>(
      null,
    )

  const questionStartTimeRef =
    useRef<number | null>(
      null,
    )

  /*
   * Tracks whether the player has pressed
   * Play at least once for the current song.
   *
   * This is reset whenever a new question loads.
   */
  const hasStartedListeningRef =
    useRef(false)

  const excludedTrackIdsRef =
    useRef<string[]>([])

  const scoreSubmittedRef =
    useRef(false)

  const initialQuestionPromiseRef =
    useRef<Promise<Question | null> | null>(
      null,
    )


  const stopTimer =
    useCallback(
      () => {
        if (
          timerRef.current !==
          null
        ) {
          window.clearInterval(
            timerRef.current,
          )

          timerRef.current =
            null
        }
      },
      [],
    )


  const stopAudio =
    useCallback(
      () => {
        const audio =
          audioRef.current

        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }

        setIsPlaying(false)
      },
      [],
    )


  /*
   * -------------------------------------------------------
   * QUESTION AUDIO
   * -------------------------------------------------------
   */

  useEffect(() => {
    const previousAudio =
      audioRef.current

    if (previousAudio) {
      previousAudio.pause()
      previousAudio.currentTime = 0
      previousAudio.src = ''
    }

    audioRef.current =
      null

    setIsPlaying(false)

    if (
      !question?.song.audioUrl
    ) {
      return
    }

    const audio =
      new Audio(
        question.song.audioUrl,
      )

    audio.preload = 'auto'

    audio.onended = () => {
      setIsPlaying(false)
      stopTimer()
    }

    audio.onerror = () => {
      console.error(
        'Audio preview failed to load:',
        question.song.audioUrl,
      )

      setIsPlaying(false)
      stopTimer()
    }

    audioRef.current =
      audio

    return () => {
      audio.pause()
      audio.currentTime = 0
      audio.src = ''
      stopTimer()
    }
  }, [
    question,
    stopTimer,
  ])


  /*
   * -------------------------------------------------------
   * FETCH QUESTION
   * -------------------------------------------------------
   */

  const fetchQuestion =
    useCallback(
      async () => {
        if (
          !selectedArtist ||
          !selectedArtistId
        ) {
          setError(
            'No artist was selected.',
          )

          return null
        }

        try {
          setError(null)

          const nextQuestion =
            await generateQuestion(
              'name-the-song',
              'medium',
              undefined,
              excludedTrackIdsRef.current,
              undefined,
              selectedArtist,
              selectedArtistId,
            )

          if (
            !nextQuestion
          ) {
            throw new Error(
              `Could not generate a question for ${selectedArtist}.`,
            )
          }

          if (
            nextQuestion.song.id &&
            !excludedTrackIdsRef.current.includes(
              nextQuestion.song.id,
            )
          ) {
            excludedTrackIdsRef.current.push(
              nextQuestion.song.id,
            )
          }

          return nextQuestion
        } catch (err) {
          console.error(
            'Failed to fetch artist question:',
            err,
          )

          setError(
            err instanceof Error
              ? err.message
              : 'Could not load the next question.',
          )

          return null
        }
      },
      [
        selectedArtist,
        selectedArtistId,
      ],
    )


  /*
   * -------------------------------------------------------
   * TIMER
   * -------------------------------------------------------
   *
   * The timer does NOT start when a question loads.
   *
   * It only starts after the player successfully
   * presses Play.
   */

  const startTimer =
    useCallback(
      () => {
        stopTimer()

        timerRef.current =
          window.setInterval(
            () => {
              setTimeRemaining(
                previous => {
                  if (
                    previous <=
                    1
                  ) {
                    stopTimer()

                    return 0
                  }

                  return previous - 1
                },
              )
            },
            1000,
          )
      },
      [
        stopTimer,
      ],
    )


  const loadQuestion =
    useCallback(
      (
        nextQuestion: Question,
      ) => {
        stopTimer()
        stopAudio()

        setSelectedAnswer(
          null,
        )

        setTimeRemaining(
          RECOGNITION_TIME,
        )

        setQuestion(
          nextQuestion,
        )

        /*
         * A new song always requires a fresh
         * Play press before the timer begins.
         */
        hasStartedListeningRef.current =
          false

        questionStartTimeRef.current =
          null
      },
      [
        stopAudio,
        stopTimer,
      ],
    )


  /*
   * -------------------------------------------------------
   * INITIAL QUESTION
   * -------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false

    if (
      !selectedArtist ||
      !selectedArtistId
    ) {
      setLoading(false)

      return
    }

    if (
      !initialQuestionPromiseRef.current
    ) {
      initialQuestionPromiseRef.current =
        fetchQuestion()
    }

    const loadInitialQuestion =
      async () => {
        setLoading(true)

        const firstQuestion =
          await initialQuestionPromiseRef.current

        if (
          cancelled
        ) {
          return
        }

        if (
          firstQuestion
        ) {
          loadQuestion(
            firstQuestion,
          )
        }

        setLoading(false)
      }

    void loadInitialQuestion()

    return () => {
      cancelled = true
      stopTimer()
      stopAudio()
    }
  }, [
    fetchQuestion,
    loadQuestion,
    selectedArtist,
    selectedArtistId,
    stopAudio,
    stopTimer,
  ])


  /*
   * -------------------------------------------------------
   * TIMEOUT
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (
      timeRemaining !==
        0 ||
      selectedAnswer !==
        null
    ) {
      return
    }

    if (!question) {
      return
    }

    const handleTimeout =
      () => {
        stopTimer()
        stopAudio()

        setSelectedAnswer(
          '',
        )

        setCurrentStreak(
          0,
        )

        setAnsweredSongs(
          previous => [
            ...previous,
            {
              question,
              answer: null,
              correct: false,
              timedOut: true,
              recognitionTime:
                RECOGNITION_TIME,
              points: 0,
            },
          ],
        )
      }

    handleTimeout()
  }, [
    question,
    selectedAnswer,
    stopAudio,
    stopTimer,
    timeRemaining,
  ])


  /*
   * -------------------------------------------------------
   * AUDIO PLAYBACK
   * -------------------------------------------------------
   */

  const togglePlayback =
    useCallback(
      async () => {
        const audio =
          audioRef.current

        if (
          !question?.song.audioUrl ||
          !audio
        ) {
          return
        }

        /*
         * PAUSE
         *
         * Pausing stops the timer.
         * The remaining time stays where it is.
         */
        if (
          isPlaying
        ) {
          audio.pause()

          stopTimer()

          setIsPlaying(
            false,
          )

          return
        }

        /*
         * PLAY / RESUME
         */
        try {
          await audio.play()

          setIsPlaying(
            true,
          )

          /*
           * The first successful Play press
           * starts the recognition clock.
           */
          if (
            !hasStartedListeningRef.current
          ) {
            hasStartedListeningRef.current =
              true

            questionStartTimeRef.current =
              Date.now()
          }

          /*
           * On the first Play, this starts the timer.
           * On Resume, it continues from the current
           * remaining time.
           */
          startTimer()
        } catch (err) {
          console.error(
            'Could not play audio:',
            err,
          )

          setIsPlaying(
            false,
          )

          stopTimer()
        }
      },
      [
        isPlaying,
        question,
        startTimer,
        stopTimer,
      ],
    )


  /*
   * -------------------------------------------------------
   * ANSWER
   * -------------------------------------------------------
   */

  const handleAnswer =
    useCallback(
      (
        answer: string,
      ) => {
        if (
          !question ||
          selectedAnswer !==
            null ||
          timeRemaining <= 0
        ) {
          return
        }

        stopTimer()
        stopAudio()

        const recognitionTime =
          questionStartTimeRef.current
            ? Math.min(
                RECOGNITION_TIME,
                Math.max(
                  0,
                  (Date.now() -
                    questionStartTimeRef.current) /
                    1000,
                ),
              )
            : 0

        const correctAnswer =
          question.correctAnswer

        const isCorrect =
          answer
            .trim()
            .toLowerCase() ===
          correctAnswer
            .trim()
            .toLowerCase()

        const points =
          isCorrect
            ? calculateArtistPoints(
                timeRemaining,
                currentStreak,
              )
            : 0

        setSelectedAnswer(
          answer,
        )

        setTotalListeningTime(
          previous =>
            previous +
            recognitionTime,
        )

        setAnsweredSongs(
          previous => [
            ...previous,
            {
              question,
              answer,
              correct:
                isCorrect,
              timedOut:
                false,
              recognitionTime,
              points,
            },
          ],
        )

        if (
          isCorrect
        ) {
          const newStreak =
            currentStreak + 1

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

          setScore(
            previous =>
              previous + points,
          )
        } else {
          setCurrentStreak(
            0,
          )
        }
      },
      [
        currentStreak,
        question,
        selectedAnswer,
        stopAudio,
        stopTimer,
        timeRemaining,
      ],
    )


  /*
   * -------------------------------------------------------
   * SCORE SUBMISSION
   * -------------------------------------------------------
   */

  const submitFinalScore =
    useCallback(
      async () => {
        if (
          scoreSubmittedRef.current
        ) {
          return
        }

        scoreSubmittedRef.current =
          true

        try {
          const {
            submitScore,
          } =
            await import(
              '../../services/scoreService'
            )

          const accuracy =
            TOTAL_QUESTIONS >
            0
              ? Math.round(
                  (correctAnswers /
                    TOTAL_QUESTIONS) *
                    100,
                )
              : 0

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
        } catch (err) {
          console.error(
            'Failed to submit score:',
            err,
          )
        }
      },
      [
        bestStreak,
        correctAnswers,
        score,
        totalListeningTime,
      ],
    )


  /*
   * -------------------------------------------------------
   * NEXT QUESTION
   * -------------------------------------------------------
   */

  const handleNextQuestion =
    useCallback(
      async () => {
        if (
          !question ||
          selectedAnswer ===
            null
        ) {
          return
        }

        stopTimer()
        stopAudio()

        if (
          currentQuestion >=
          TOTAL_QUESTIONS
        ) {
          await submitFinalScore()

          setShowResults(
            true,
          )

          return
        }

        setLoadingNext(
          true,
        )

        const nextQuestion =
          await fetchQuestion()

        if (
          !nextQuestion
        ) {
          setLoadingNext(
            false,
          )

          return
        }

        setCurrentQuestion(
          previous =>
            previous + 1,
        )

        loadQuestion(
          nextQuestion,
        )

        setLoadingNext(
          false,
        )
      },
      [
        currentQuestion,
        fetchQuestion,
        loadQuestion,
        question,
        selectedAnswer,
        stopAudio,
        stopTimer,
        submitFinalScore,
      ],
    )


  /*
   * -------------------------------------------------------
   * EXIT
   * -------------------------------------------------------
   */

  const handleExit =
    useCallback(
      () => {
        stopTimer()
        stopAudio()

        navigate('/play')
      },
      [
        navigate,
        stopAudio,
        stopTimer,
      ],
    )


  const handlePlayAgain =
    useCallback(
      () => {
        navigate(
          '/play-by-artist',
          {
            state: {
              artist:
                selectedArtist,
              artistId:
                selectedArtistId,
            },
          },
        )
      },
      [
        navigate,
        selectedArtist,
        selectedArtistId,
      ],
    )


  /*
   * -------------------------------------------------------
   * RESULTS DATA
   * -------------------------------------------------------
   */

  const fastestSong =
    useMemo(() => {
      const answered =
        answeredSongs.filter(
          song =>
            !song.timedOut,
        )

      if (
        answered.length ===
        0
      ) {
        return null
      }

      return answered.reduce(
        (
          fastest,
          current,
        ) =>
          current.recognitionTime <
          fastest.recognitionTime
            ? current
            : fastest,
      )
    }, [
      answeredSongs,
    ])


  const slowestSong =
    useMemo(() => {
      const answered =
        answeredSongs.filter(
          song =>
            !song.timedOut,
        )

      if (
        answered.length ===
        0
      ) {
        return null
      }

      return answered.reduce(
        (
          slowest,
          current,
        ) =>
          current.recognitionTime >
          slowest.recognitionTime
            ? current
            : slowest,
      )
    }, [
      answeredSongs,
    ])


  const resultMessage =
    correctAnswers >=
    10
      ? 'That’s a standing ovation score.'
      : correctAnswers >=
          7
        ? 'Almost flawless… the crowd’s already cheering.'
        : correctAnswers >=
            4
          ? 'Solid effort, you’re halfway to superstar status!'
          : 'Hey, even legends miss a few notes.'


  const confettiCount =
    correctAnswers >=
    10
      ? 100
      : correctAnswers >=
          7
        ? 65
        : correctAnswers >=
            4
          ? 35
          : 12


  const confettiPieces =
    useMemo(
      () =>
        Array.from(
          {
            length:
              confettiCount,
          },
          (
            _,
            index,
          ) => ({
            id: index,
            x:
              `${(
                (index * 37) %
                101
              )}%`,
            rotation:
              `${(
                (index * 47) %
                360
              )}deg`,
            duration:
              `${3 +
                ((index * 13) %
                  25) /
                  10}s`,
            delay:
              `${(
                (index * 17) %
                18
              ) /
                10}s`,
          }),
        ),
      [
        confettiCount,
      ],
    )


  /*
   * -------------------------------------------------------
   * ARTIST VALIDATION
   * -------------------------------------------------------
   */

  if (
    !selectedArtist ||
    !selectedArtistId
  ) {
    return (
      <main className="play-by-artist__error-page">
        <div className="play-by-artist__error-card">
          <h1>
            ARTIST NOT FOUND
          </h1>

          <p>
            Please choose an artist
            before starting this
            mode.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/play')
            }
          >
            BACK TO PLAY
          </button>
        </div>
      </main>
    )
  }


  /*
   * -------------------------------------------------------
   * INITIAL LOADING
   * -------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="play-by-artist__loading-page">
        <div className="play-by-artist__loading-content">
          <div className="play-by-artist__loading-spinner" />

          <p>
            LOADING{' '}
            {selectedArtist.toUpperCase()}
            ...
          </p>
        </div>
      </main>
    )
  }


  /*
   * -------------------------------------------------------
   * GAME ERROR
   * -------------------------------------------------------
   */

  if (
    error &&
    !question
  ) {
    return (
      <main className="play-by-artist__error-page">
        <div className="play-by-artist__error-card">
          <h1>
            COULD NOT LOAD GAME
          </h1>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/play')
            }
          >
            BACK TO PLAY
          </button>
        </div>
      </main>
    )
  }


  /*
   * -------------------------------------------------------
   * RESULTS
   * -------------------------------------------------------
   */

  if (showResults) {
    const accuracy =
      TOTAL_QUESTIONS >
      0
        ? Math.round(
            (correctAnswers /
              TOTAL_QUESTIONS) *
              100,
          )
        : 0

    return (
      <main className="play-by-artist-results">
        <div className="play-by-artist-results__confetti is-celebration">
          {confettiPieces.map(
            piece => (
              <span
                key={piece.id}
                style={{
                  '--confetti-x':
                    piece.x,
                  '--confetti-rotation':
                    piece.rotation,
                  '--confetti-duration':
                    piece.duration,
                  '--confetti-delay':
                    piece.delay,
                } as React.CSSProperties}
              />
            ),
          )}
        </div>

        <div className="play-by-artist-results__container">
          <section className="play-by-artist-results__hero">
            <div className="play-by-artist-results__trophy">
              <Trophy
                size={42}
              />
            </div>

            <p className="play-by-artist-results__eyebrow">
              {selectedArtist.toUpperCase()}{' '}
              COMPLETE
            </p>

            <h1 className="play-by-artist-results__title">
              GAME OVER
            </h1>

            <p className="play-by-artist-results__subtitle">
              You finished all{' '}
              {TOTAL_QUESTIONS}{' '}
              songs.
            </p>

            <p className="play-by-artist-results__message">
              {resultMessage}
            </p>
          </section>

          <section className="play-by-artist-results__score-card">
            <p className="play-by-artist-results__score-label">
              FINAL SCORE
            </p>

            <p className="play-by-artist-results__score">
              {score.toLocaleString()}
            </p>
          </section>

          <section className="play-by-artist-results__stats">
            <div className="play-by-artist-results__stat">
              <span>
                ACCURACY
              </span>

              <strong>
                {accuracy}%
              </strong>
            </div>

            <div className="play-by-artist-results__stat">
              <span>
                CORRECT
              </span>

              <strong>
                {correctAnswers}/
                {TOTAL_QUESTIONS}
              </strong>
            </div>

            <div className="play-by-artist-results__stat">
              <span>
                BEST STREAK
              </span>

              <strong>
                {bestStreak}
              </strong>
            </div>

            <div className="play-by-artist-results__stat">
              <span>
                LISTENING TIME
              </span>

              <strong>
                {totalListeningTime.toFixed(
                  1,
                )}
                s
              </strong>
            </div>
          </section>

          {(
            fastestSong ||
            slowestSong
          ) && (
            <section className="play-by-artist-results__recognition">
              {fastestSong && (
                <div className="play-by-artist-results__recognition-card">
                  <Clock
                    size={20}
                  />

                  <div>
                    <p className="play-by-artist-results__recognition-label">
                      FASTEST
                      RECOGNITION
                    </p>

                    <strong>
                      {fastestSong.recognitionTime.toFixed(
                        1,
                      )}
                      s
                    </strong>

                    <span>
                      {
                        fastestSong
                          .question
                          .song
                          .title
                      }
                    </span>
                  </div>
                </div>
              )}

              {slowestSong && (
                <div className="play-by-artist-results__recognition-card">
                  <Clock
                    size={20}
                  />

                  <div>
                    <p className="play-by-artist-results__recognition-label">
                      SLOWEST
                      RECOGNITION
                    </p>

                    <strong>
                      {slowestSong.recognitionTime.toFixed(
                        1,
                      )}
                      s
                    </strong>

                    <span>
                      {
                        slowestSong
                          .question
                          .song
                          .title
                      }
                    </span>
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="play-by-artist-results__songs">
            <div className="play-by-artist-results__section-header">
              <p>
                YOUR RUN
              </p>

              <span>
                {correctAnswers}{' '}
                /{' '}
                {TOTAL_QUESTIONS}{' '}
                CORRECT
              </span>
            </div>

            <div className="play-by-artist-results__song-list">
              {answeredSongs.map(
                (
                  answeredSong,
                  index,
                ) => {
                  const song =
                    answeredSong
                      .question
                      .song

                  return (
                    <div
                      className="play-by-artist-results__song"
                      key={`${song.id}-${index}`}
                    >
                      <span className="play-by-artist-results__song-number">
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          '0',
                        )}
                      </span>

                      {song.artworkUrl && (
                        <img
                          className="play-by-artist-results__song-artwork"
                          src={
                            song.artworkUrl
                          }
                          alt=""
                        />
                      )}

                      <div className="play-by-artist-results__song-info">
                        <strong>
                          {
                            song.title
                          }
                        </strong>

                        <span>
                          {
                            song.artist
                          }
                        </span>
                      </div>

                      <div
                        className={`play-by-artist-results__song-result ${
                          answeredSong.correct
                            ? 'is-correct'
                            : 'is-incorrect'
                        }`}
                      >
                        {answeredSong.correct ? (
                          <>
                            <Check
                              size={
                                16
                              }
                            />

                            <span>
                              +
                              {
                                answeredSong.points
                              }
                            </span>
                          </>
                        ) : answeredSong.timedOut ? (
                          <>
                            <Clock
                              size={
                                16
                              }
                            />

                            <span>
                              TIME
                            </span>
                          </>
                        ) : (
                          <>
                            <X
                              size={
                                16
                              }
                            />

                            <span>
                              MISS
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                },
              )}
            </div>
          </section>

          <section className="play-by-artist-results__actions">
            <button
              type="button"
              className="play-by-artist-results__primary-button"
              onClick={
                handlePlayAgain
              }
            >
              PLAY AGAIN
            </button>

            <button
              type="button"
              className="play-by-artist-results__secondary-button"
              onClick={() =>
                navigate('/play')
              }
            >
              CHOOSE ANOTHER
              ARTIST
            </button>
          </section>
        </div>
      </main>
    )
  }


  if (!question) {
    return null
  }


  const progress =
    (currentQuestion /
      TOTAL_QUESTIONS) *
    100

  const answerLocked =
    selectedAnswer !==
      null ||
    timeRemaining ===
      0

  const answerIsCorrect =
    selectedAnswer !==
      null &&
    selectedAnswer
      .trim()
      .toLowerCase() ===
      question.correctAnswer
        .trim()
        .toLowerCase()


  return (
    <main className="play-by-artist">
      <div className="play-by-artist__container">
        <header className="play-by-artist__header">
          <div className="play-by-artist__header-main">

            <button
              type="button"
              className="play-by-artist__exit-button"
              onClick={
                handleExit
              }
              aria-label="Exit game"
            >
              <ArrowLeft
                size={16}
              />

              <span>
                EXIT
              </span>
            </button>

            <h1 className="play-by-artist__title">
              NAME THAT SONG
            </h1>

            <div className="play-by-artist__artist-badge">
              {
                selectedArtist
              }
            </div>
          </div>

          <div className="play-by-artist__header-right">
            <div className="play-by-artist__streak">
              <span>
                STREAK
              </span>

              <strong>
                {currentStreak}
              </strong>
            </div>

            <div className="play-by-artist__round">
              <span>
                {String(
                  currentQuestion,
                ).padStart(
                  2,
                  '0',
                )}
              </span>

              <small>
                /{' '}
                {String(
                  TOTAL_QUESTIONS,
                ).padStart(
                  2,
                  '0',
                )}
              </small>
            </div>
          </div>
        </header>

        <div className="play-by-artist__progress">
          <div
            className="play-by-artist__progress-bar"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <section className="play-by-artist__board">
          <div className="play-by-artist__question-panel">
            <div className="play-by-artist__question-header">
              <div className="play-by-artist__timer">
                <Clock
                  size={18}
                />

                <span>
                  {String(
                    timeRemaining,
                  ).padStart(
                    2,
                    '0',
                  )}
                </span>
              </div>
            </div>

            <div className="play-by-artist__question-content">
              {selectedAnswer ===
                null &&
              timeRemaining >
                0 ? (
                <>
                  <span className="play-by-artist__question-mark">
                    ?
                  </span>

                  <p className="play-by-artist__question-eyebrow">
                    LISTEN CLOSELY
                  </p>

                  <h2 className="play-by-artist__instruction">
                    Can you name
                    this song?
                  </h2>
                </>
              ) : (
                <>
                  <div
                    className={`play-by-artist__result-icon ${
                      answerIsCorrect
                        ? 'is-correct'
                        : 'is-incorrect'
                    }`}
                  >
                    {answerIsCorrect ? (
                      <Check
                        size={32}
                      />
                    ) : (
                      <X
                        size={32}
                      />
                    )}
                  </div>

                  <p className="play-by-artist__question-eyebrow">
                    {selectedAnswer ===
                      null ||
                    selectedAnswer ===
                      ''
                      ? 'TIME IS UP'
                      : answerIsCorrect
                        ? 'CORRECT'
                        : 'NOT QUITE'}
                  </p>

                  <h2 className="play-by-artist__revealed-title">
                    {
                      question
                        .song
                        .title
                    }
                  </h2>

                  <p className="play-by-artist__revealed-artist">
                    {
                      question
                        .song
                        .artist
                    }
                  </p>

                  <p className="play-by-artist__revealed-album">
                    {
                      question
                        .song
                        .album
                    }
                  </p>

                  {question
                    .song
                    .artworkUrl && (
                    <img
                      className="play-by-artist__artwork"
                      src={
                        question
                          .song
                          .artworkUrl
                      }
                      alt={
                        question
                          .song
                          .album
                      }
                    />
                  )}
                </>
              )}
            </div>

            <div className="play-by-artist__audio">
              <button
                type="button"
                className="play-by-artist__play-button"
                onClick={() =>
                  void togglePlayback()
                }
                disabled={
                  !question
                    .song
                    .audioUrl ||
                  answerLocked
                }
                aria-label={
                  isPlaying
                    ? 'Pause song'
                    : 'Play song'
                }
              >
                {isPlaying ? (
                  <Pause
                    size={22}
                  />
                ) : (
                  <Play
                    size={22}
                  />
                )}
              </button>

              <div className="play-by-artist__waveform">
                {Array.from({
                  length: 32,
                }).map(
                  (
                    _,
                    index,
                  ) => (
                    <span
                      key={
                        index
                      }
                      style={{
                        height: `${
                          20 +
                          ((index *
                            17) %
                            60)
                        }%`,
                      }}
                    />
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="play-by-artist__answers-panel">
            <div className="play-by-artist__answers-header">
              <p className="play-by-artist__answers-eyebrow">
                YOUR ANSWER
              </p>
            </div>

            <div className="play-by-artist__answers">
              {question.answers.map(
                (
                  answer,
                  index,
                ) => {
                  const isCorrect =
                    answer
                      .trim()
                      .toLowerCase() ===
                    question
                      .correctAnswer
                      .trim()
                      .toLowerCase()

                  const isSelected =
                    selectedAnswer ===
                    answer

                  let answerClass =
                    'play-by-artist__answer'

                  if (
                    selectedAnswer !==
                    null
                  ) {
                    if (
                      isCorrect
                    ) {
                      answerClass +=
                        ' is-correct'
                    } else if (
                      isSelected
                    ) {
                      answerClass +=
                        ' is-incorrect'
                    } else {
                      answerClass +=
                        ' is-disabled'
                    }
                  }

                  return (
                    <button
                      type="button"
                      key={
                        answer
                      }
                      className={
                        answerClass
                      }
                      disabled={
                        answerLocked
                      }
                      onClick={() =>
                        handleAnswer(
                          answer,
                        )
                      }
                    >
                      <span className="play-by-artist__answer-letter">
                        {String.fromCharCode(
                          65 +
                            index,
                        )}
                      </span>

                      <span className="play-by-artist__answer-text">
                        {
                          answer
                        }
                      </span>

                      {selectedAnswer !==
                        null &&
                        isCorrect && (
                          <Check
                            size={
                              18
                            }
                          />
                        )}

                      {selectedAnswer !==
                        null &&
                        isSelected &&
                        !isCorrect && (
                          <X
                            size={
                              18
                            }
                          />
                        )}
                    </button>
                  )
                },
              )}
            </div>
          </div>
        </section>

        <div className="play-by-artist__play-hint">
          {selectedAnswer ===
            null &&
          timeRemaining >
            0
            ? 'Choose the song you think you heard.'
            : selectedAnswer ===
                null
              ? 'Time is up.'
              : answerIsCorrect
                ? `+${calculateArtistPoints(
                    timeRemaining,
                    currentStreak - 1,
                  )} POINTS`
                : `THE ANSWER WAS "${question.correctAnswer.toUpperCase()}"`}
        </div>

        {selectedAnswer !==
          null && (
          <div className="play-by-artist__next-wrapper">
            <button
              type="button"
              className="play-by-artist__next-button"
              onClick={() =>
                void handleNextQuestion()
              }
              disabled={
                loadingNext
              }
            >
              {loadingNext ? (
                <span className="play-by-artist__button-spinner" />
              ) : currentQuestion ===
                TOTAL_QUESTIONS ? (
                'SEE RESULTS'
              ) : (
                'NEXT SONG'
              )}
            </button>
          </div>
        )}

        <footer className="play-by-artist__footer">
          <span>
            {score.toLocaleString()}{' '}
            POINTS
          </span>

          <span>
            {correctAnswers}{' '}
            CORRECT
          </span>
        </footer>
      </div>
    </main>
  )
}