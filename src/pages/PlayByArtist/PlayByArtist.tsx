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
  recognitionTime: number | null
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

  const [hasStartedListening, setHasStartedListening] =
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
     * Do NOT autoplay.
     *
     * The recognition timer begins only after
     * the player manually presses Play.
     */

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

            /*
             * Start the recognition clock ONLY on
             * the first successful Play press.
             */
            if (
              !hasStartedListening &&
              selectedAnswer === null
            ) {
              questionStartTimeRef.current =
                Date.now()

              setHasStartedListening(true)
            }
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

  const getRecognitionTime =
    () => {
      if (
        questionStartTimeRef.current ===
        null
      ) {
        return null
      }

      return Math.min(
        RECOGNITION_TIME,
        Math.max(
          0,
          Math.round(
            (
              Date.now() -
              questionStartTimeRef.current
            ) / 1000,
          ),
        ),
      )
    }


  const recordListeningTime =
    () => {
      const recognitionTime =
        getRecognitionTime()

      if (
        recognitionTime === null
      ) {
        return null
      }

      setTotalListeningTime(
        previous =>
          previous + recognitionTime,
      )

      questionStartTimeRef.current =
        null

      return recognitionTime
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

      const recognitionTime =
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

      setHasStartedListening(false)

      setCurrentStreak(0)

      setAnsweredSongs(
        previous => [
          ...previous,
          {
            question,
            answer: null,
            correct: false,
            timedOut: true,
            recognitionTime,
          },
        ],
      )

      if (audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      }

      void preloadNextQuestion()
    }


  /*
   * ---------------------------------------------------------
   * TIMER
   * ---------------------------------------------------------
   *
   * The timer does NOT begin when the question loads.
   * It only begins after the first successful Play.
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (
      !question ||
      !hasStartedListening ||
      selectedAnswer !== null
    ) {
      return
    }

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
  }, [
    question,
    hasStartedListening,
    selectedAnswer,
  ])


  /*
   * ---------------------------------------------------------
   * RESOLVE TIMEOUT
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (
      timeRemaining !== 0 ||
      !question ||
      selectedAnswer !== null ||
      !hasStartedListening
    ) {
      return
    }

    handleTimeout()
  }, [
    timeRemaining,
    question,
    selectedAnswer,
    hasStartedListening,
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

      const recognitionTime =
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

      setHasStartedListening(false)

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
            recognitionTime,
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

        setHasStartedListening(
          false,
        )

        setIsPlaying(false)

        questionStartTimeRef.current =
          null

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
   * RESULTS HELPERS
   * ---------------------------------------------------------
   */

  const getResultMessage =
    () => {
      if (correctAnswers === 10) {
        return 'Perfect score! The crowd goes wild!'
      }

      if (correctAnswers >= 7) {
        return 'Almost flawless… the crowd’s already cheering.'
      }

      if (correctAnswers >= 4) {
        return 'Solid effort, you’re halfway to superstar status!'
      }

      return 'Hey, even legends miss a few notes.'
    }


  const getConfettiCount =
    () => {
      if (correctAnswers === 10) {
        return 80
      }

      if (correctAnswers >= 7) {
        return 45
      }

      if (correctAnswers >= 4) {
        return 22
      }

      if (correctAnswers > 0) {
        return 7
      }

      return 0
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

    const recognisedSongs =
      answeredSongs.filter(
        song =>
          song.recognitionTime !== null,
      )

    const fastestSong =
      recognisedSongs.length > 0
        ? recognisedSongs.reduce(
            (
              fastest,
              current,
            ) =>
              (
                current.recognitionTime ?? Infinity
              ) <
              (
                fastest.recognitionTime ?? Infinity
              )
                ? current
                : fastest,
          )
        : null

    const slowestSong =
      recognisedSongs.length > 0
        ? recognisedSongs.reduce(
            (
              slowest,
              current,
            ) =>
              (
                current.recognitionTime ?? -Infinity
              ) >
              (
                slowest.recognitionTime ?? -Infinity
              )
                ? current
                : slowest,
          )
        : null

    const confettiCount =
      getConfettiCount()

    return (
      <main className="play-by-artist-results">

        {confettiCount > 0 && (
          <div
            className={`play-by-artist-results__confetti ${
              correctAnswers === 10
                ? 'is-celebration'
                : ''
            }`}
            aria-hidden="true"
          >
            {Array.from(
              { length: confettiCount },
              (_, index) => (
                <span
                  key={index}
                  style={{
                    '--confetti-x': `${(
                      (index * 47) % 100
                    )}%`,
                    '--confetti-delay': `${(
                      (index * 0.07) % 1.4
                    )}s`,
                    '--confetti-rotation': `${
                      (index * 37) % 360
                    }deg`,
                    '--confetti-duration': `${
                      2.5 +
                      ((index * 13) % 20) / 10
                    }s`,
                  } as React.CSSProperties}
                />
              ),
            )}
          </div>
        )}

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

            <p className="play-by-artist-results__message">
              {getResultMessage()}
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


          {recognisedSongs.length > 0 && (
            <section className="play-by-artist-results__recognition">

              {fastestSong && (
                <div className="play-by-artist-results__recognition-card">
                  <span className="play-by-artist-results__recognition-label">
                    FASTEST TO RECOGNISE
                  </span>

                  <strong>
                    {fastestSong.question.song.title}
                  </strong>

                  <small>
                    {fastestSong.recognitionTime}s
                  </small>
                </div>
              )}

              {slowestSong && (
                <div className="play-by-artist-results__recognition-card">
                  <span className="play-by-artist-results__recognition-label">
                    SLOWEST TO RECOGNISE
                  </span>

                  <strong>
                    {slowestSong.question.song.title}
                  </strong>

                  <small>
                    {slowestSong.recognitionTime}s
                  </small>
                </div>
              )}

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
                (
                  item,
                  index,
                ) => (
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

                    {item.question.song.artworkUrl ? (
                      <img
                        src={
                          item.question.song.artworkUrl
                        }
                        alt=""
                        className="play-by-artist-results__song-artwork"
                      />
                    ) : (
                      <span className="play-by-artist-results__song-number">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    )}


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
                navigate(
                  '/play-by-artist',
                  {
                    state: {
                      artist:
                        selectedArtist,
                    },
                  },
                )
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

          <h1>
            No artist selected
          </h1>

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

              <span>
                ARTIST
              </span>

              <strong>
                {selectedArtist}
              </strong>

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
                ROUND
              </span>

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
                    timeRemaining <= 3 &&
                    hasStartedListening
                      ? 'is-danger'
                      : ''
                  }`
                }
              >
                {hasStartedListening
                  ? `${timeRemaining}s`
                  : 'READY'}
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
                    Press play to start the timer,
                    then choose the correct song title.
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
                Press play to hear the song preview
                and start the timer.
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