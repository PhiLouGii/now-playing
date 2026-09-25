import {
  useCallback,
  useEffect,
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
    useState<AnsweredSong[]>(
      [],
    )


  const audioRef =
    useRef<HTMLAudioElement | null>(
      null,
    )

  const timerRef =
    useRef<number | null>(
      null,
    )

  const questionStartTimeRef =
    useRef<number>(
      Date.now(),
    )

  const excludedTrackIdsRef =
    useRef<string[]>(
      [],
    )

  const scoreSubmittedRef =
    useRef(false)

  const initialLoadRef =
    useRef(false)


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
   *
   * Every question gets its own Audio object.
   *
   * This is critical.
   *
   * The previous implementation created an Audio object
   * only the first time the player was clicked, meaning
   * question 2 could still play question 1's preview.
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
    }

    audio.onerror = () => {
      console.error(
        'Audio preview failed to load:',
        question.song.audioUrl,
      )

      setIsPlaying(false)
    }

    audioRef.current =
      audio

    return () => {
      audio.pause()
      audio.currentTime = 0
      audio.src = ''
    }
  }, [
    question,
  ])


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

          setLoading(false)

          return null
        }

        try {
          setError(null)

          /*
           * This request is made ONLY when we actually
           * need the next question.
           *
           * There is no background preloading.
           */
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

          /*
           * Reserve this track only after the question
           * has actually been generated.
           */
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


  const startTimer =
    useCallback(
      () => {
        stopTimer()

        questionStartTimeRef.current =
          Date.now()

        setTimeRemaining(
          RECOGNITION_TIME,
        )

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

        /*
         * Setting the question here triggers the audio
         * effect above, which creates a completely new
         * Audio object for this exact question.
         */
        setQuestion(
          nextQuestion,
        )

        questionStartTimeRef.current =
          Date.now()

        startTimer()
      },
      [
        startTimer,
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
    if (
      initialLoadRef.current
    ) {
      return
    }

    initialLoadRef.current =
      true

    const loadInitialQuestion =
      async () => {
        setLoading(true)

        const firstQuestion =
          await fetchQuestion()

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
      stopTimer()
      stopAudio()
    }
  }, [
    fetchQuestion,
    loadQuestion,
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

        const recognitionTime =
          RECOGNITION_TIME

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
              recognitionTime,
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

        if (
          isPlaying
        ) {
          audio.pause()

          setIsPlaying(
            false,
          )

          return
        }

        try {
          /*
           * The audio object was created specifically
           * for the current question.
           */
          await audio.play()

          setIsPlaying(
            true,
          )
        } catch (err) {
          console.error(
            'Could not play audio:',
            err,
          )

          setIsPlaying(
            false,
          )
        }
      },
      [
        isPlaying,
        question,
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
          Math.min(
            RECOGNITION_TIME,
            Math.max(
              0,
              (Date.now() -
                questionStartTimeRef.current) /
                1000,
            ),
          )

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
   *
   * No preloaded question exists anymore.
   *
   * We generate the next question only after the player
   * explicitly finishes the current one.
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

    const answeredWithRecognition =
      answeredSongs.filter(
        song =>
          !song.timedOut &&
          song.recognitionTime >=
            0,
      )

    const fastestSong =
      answeredWithRecognition.length >
      0
        ? answeredWithRecognition.reduce(
            (
              fastest,
              current,
            ) =>
              current.recognitionTime <
              fastest.recognitionTime
                ? current
                : fastest,
          )
        : null

    return (
      <main className="play-by-artist-results">
        <div className="play-by-artist-results__container">
          <section className="play-by-artist-results__hero">
            <div
              className="play-by-artist-results__confetti"
              aria-hidden="true"
            />

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
              {score >=
              2500
                ? 'You really know this artist.'
                : score >=
                    1800
                  ? 'You know your way around their catalogue.'
                  : score >=
                      1000
                    ? 'A solid run. There are a few more songs to learn.'
                    : 'Keep playing. Their catalogue has more surprises waiting.'}
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

          {fastestSong && (
            <section className="play-by-artist-results__recognition">
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
              className="play-by-artist__eyebrow"
              onClick={
                handleExit
              }
            >
              <ArrowLeft
                size={15}
              />

              EXIT
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
                    .audioUrl
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
                    currentStreak -
                      1,
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