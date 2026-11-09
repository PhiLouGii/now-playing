
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Clock,
  Pause,
  Play,
  Trophy,
  X,
} from 'lucide-react'

import LoadingScreen from '../../components/loading/LoadingScreen'
import {
  generateQuestion,
  getLoadingFacts,
} from '../../services/gameService'
import type { LoadingFact } from '../../services/gameService'
import type { Question } from '../../types/game'
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
    (timeRemaining / RECOGNITION_TIME) * 100 * (1 + streak * 0.1),
  )
}

export default function PlayByArtist() {
  const navigate = useNavigate()
  const location = useLocation()

  const {
    artist: selectedArtist,
    artistId: selectedArtistId,
  } = (location.state as LocationState) ?? {}

  const [question, setQuestion] = useState<Question | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [loadingFacts, setLoadingFacts] = useState<LoadingFact[]>([])
  const [loadingComplete, setLoadingComplete] = useState(false)
  const [loadingNext, setLoadingNext] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(RECOGNITION_TIME)

  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [totalListeningTime, setTotalListeningTime] = useState(0)

  const [showResults, setShowResults] = useState(false)
  const [answeredSongs, setAnsweredSongs] = useState<AnsweredSong[]>([])

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<number | null>(null)
  const questionStartTimeRef = useRef<number | null>(null)
  const hasStartedListeningRef = useRef(false)
  const excludedTrackIdsRef = useRef<string[]>([])
  const scoreSubmittedRef = useRef(false)
  const initialQuestionPromiseRef = useRef<Promise<Question | null> | null>(
    null,
  )

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopAudio = useCallback(() => {
    const audio = audioRef.current

    if (audio) {
      audio.pause()

      try {
        audio.currentTime = 0
      } catch {
        // Audio metadata may not have loaded yet.
      }
    }

    setIsPlaying(false)
  }, [])

  /*
   * Create an audio element for the current song.
   */
  useEffect(() => {
    const audioUrl = question?.song.audioUrl

    if (!audioUrl) {
      audioRef.current = null
      setIsPlaying(false)
      return
    }

    const audio = new Audio()
    audio.preload = 'auto'
    audio.src = audioUrl

    audio.onplaying = () => {
      setIsPlaying(true)
    }

    audio.onpause = () => {
      setIsPlaying(false)
    }

    audio.onended = () => {
      setIsPlaying(false)
      stopTimer()
    }

    audio.onerror = () => {
      console.error('Audio preview failed to load:', {
        url: audio.src,
        errorCode: audio.error?.code,
        errorMessage: audio.error?.message,
      })

      setIsPlaying(false)
      stopTimer()
    }

    audioRef.current = audio
    audio.load()

    return () => {
      audio.onplaying = null
      audio.onpause = null
      audio.onended = null
      audio.onerror = null

      audio.pause()
      audio.removeAttribute('src')
      audio.load()

      if (audioRef.current === audio) {
        audioRef.current = null
      }

      stopTimer()
    }
  }, [question, stopTimer])

  /*
   * Fetch a question for the selected artist only.
   */
  const fetchQuestion = useCallback(async (): Promise<Question | null> => {
    if (!selectedArtist || !selectedArtistId) {
      setError('No artist was selected.')
      return null
    }

    try {
      setError(null)

      const nextQuestion = await generateQuestion(
        'name-the-song',
        'medium',
        undefined,
        excludedTrackIdsRef.current,
        undefined,
        selectedArtist,
        selectedArtistId,
      )

      if (!nextQuestion) {
        throw new Error(`Could not generate a question for ${selectedArtist}.`)
      }

      const trackId = nextQuestion.song.id

      if (
        trackId &&
        !excludedTrackIdsRef.current.includes(trackId)
      ) {
        excludedTrackIdsRef.current.push(trackId)
      }

      return nextQuestion
    } catch (err) {
      console.error('Failed to fetch artist question:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Could not load the next question.',
      )

      return null
    }
  }, [selectedArtist, selectedArtistId])

  const startTimer = useCallback(() => {
    stopTimer()

    timerRef.current = window.setInterval(() => {
      setTimeRemaining(previous => {
        if (previous <= 1) {
          stopTimer()
          return 0
        }

        return previous - 1
      })
    }, 1000)
  }, [stopTimer])

  const loadQuestion = useCallback(
    (nextQuestion: Question) => {
      stopTimer()
      stopAudio()

      setSelectedAnswer(null)
      setTimeRemaining(RECOGNITION_TIME)
      setQuestion(nextQuestion)

      hasStartedListeningRef.current = false
      questionStartTimeRef.current = null
    },
    [stopAudio, stopTimer],
  )

  /*
   * Load the first question and loading-screen facts.
   */
  useEffect(() => {
    let cancelled = false

    if (!selectedArtist || !selectedArtistId) {
      setIsInitialLoading(false)
      return
    }

    const loadInitialGame = async () => {
      setLoadingComplete(false)

      getLoadingFacts()
        .then(data => {
          if (!cancelled) {
            setLoadingFacts(data.facts)
          }
        })
        .catch(err => {
          console.error('Failed to load loading facts:', err)
        })

      if (!initialQuestionPromiseRef.current) {
        initialQuestionPromiseRef.current = fetchQuestion()
      }

      const firstQuestion = await initialQuestionPromiseRef.current

      if (cancelled) return

      if (firstQuestion) {
        loadQuestion(firstQuestion)
        setLoadingComplete(true)
      }

      setIsInitialLoading(false)
    }

    void loadInitialGame()

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
   * Handle the timer reaching zero.
   */
  useEffect(() => {
    if (timeRemaining !== 0 || selectedAnswer !== null || !question) {
      return
    }

    stopTimer()
    stopAudio()
    setSelectedAnswer('')
    setCurrentStreak(0)

    setAnsweredSongs(previous => [
      ...previous,
      {
        question,
        answer: null,
        correct: false,
        timedOut: true,
        recognitionTime: RECOGNITION_TIME,
        points: 0,
      },
    ])
  }, [
    question,
    selectedAnswer,
    stopAudio,
    stopTimer,
    timeRemaining,
  ])

  /*
   * Play and pause the current song preview.
   */
  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current

    if (
      !question?.song.audioUrl ||
      !audio ||
      selectedAnswer !== null ||
      timeRemaining <= 0
    ) {
      return
    }

    if (!audio.paused) {
      audio.pause()
      stopTimer()
      setIsPlaying(false)
      return
    }

    try {
      await audio.play()

      if (!hasStartedListeningRef.current) {
        hasStartedListeningRef.current = true
        questionStartTimeRef.current = Date.now()
      }

      setIsPlaying(true)
      startTimer()
    } catch (err) {
      console.error('Could not play audio preview:', {
        url: audio.src,
        error: err,
      })

      setIsPlaying(false)
      stopTimer()
    }
  }, [
    question,
    selectedAnswer,
    startTimer,
    stopTimer,
    timeRemaining,
  ])

  /*
   * Check the selected answer and update scoring.
   */
  const handleAnswer = useCallback(
    (answer: string) => {
      if (!question || selectedAnswer !== null || timeRemaining <= 0) {
        return
      }

      stopTimer()
      stopAudio()

      const recognitionTime = questionStartTimeRef.current
        ? Math.min(
            RECOGNITION_TIME,
            Math.max(
              0,
              (Date.now() - questionStartTimeRef.current) / 1000,
            ),
          )
        : 0

      const isCorrect =
        answer.trim().toLowerCase() ===
        question.correctAnswer.trim().toLowerCase()

      const points = isCorrect
        ? calculateArtistPoints(timeRemaining, currentStreak)
        : 0

      setSelectedAnswer(answer)
      setTotalListeningTime(previous => previous + recognitionTime)

      setAnsweredSongs(previous => [
        ...previous,
        {
          question,
          answer,
          correct: isCorrect,
          timedOut: false,
          recognitionTime,
          points,
        },
      ])

      if (isCorrect) {
        const newStreak = currentStreak + 1

        setCorrectAnswers(previous => previous + 1)
        setCurrentStreak(newStreak)
        setBestStreak(previous => Math.max(previous, newStreak))
        setScore(previous => previous + points)
      } else {
        setCurrentStreak(0)
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
   * Submit the final score once per game.
   */
  const submitFinalScore = useCallback(async () => {
    if (scoreSubmittedRef.current) return

    scoreSubmittedRef.current = true

    try {
      const { submitScore } = await import('../../services/scoreService')

      const accuracy =
        TOTAL_QUESTIONS > 0
          ? Math.round((correctAnswers / TOTAL_QUESTIONS) * 100)
          : 0

      await submitScore({
        gameMode: 'name-that-song',
        score,
        accuracy,
        bestStreak,
        questions: TOTAL_QUESTIONS,
        correctAnswers,
        totalListeningTime,
      })
    } catch (err) {
      console.error('Failed to submit score:', err)
    }
  }, [
    bestStreak,
    correctAnswers,
    score,
    totalListeningTime,
  ])

  /*
   * Continue to the next song or display the results.
   */
  const handleNextQuestion = useCallback(async () => {
    if (!question || selectedAnswer === null || loadingNext) {
      return
    }

    stopTimer()
    stopAudio()

    if (currentQuestion >= TOTAL_QUESTIONS) {
      await submitFinalScore()
      setShowResults(true)
      return
    }

    setLoadingNext(true)

    const nextQuestion = await fetchQuestion()

    if (!nextQuestion) {
      setLoadingNext(false)
      return
    }

    setCurrentQuestion(previous => previous + 1)
    loadQuestion(nextQuestion)
    setLoadingNext(false)
  }, [
    currentQuestion,
    fetchQuestion,
    loadQuestion,
    loadingNext,
    question,
    selectedAnswer,
    stopAudio,
    stopTimer,
    submitFinalScore,
  ])

  /*
   * Exit the artist game.
   */
  const handleExit = useCallback(() => {
    stopTimer()
    stopAudio()
    navigate('/play')
  }, [navigate, stopAudio, stopTimer])

  /*
   * Start a completely fresh round with the SAME artist.
   */
  const handlePlayAgain = useCallback(async () => {
    stopTimer()
    stopAudio()

    // Clear the previous run's excluded songs.
    excludedTrackIdsRef.current = []

    // Reset game submission and initial loading references.
    scoreSubmittedRef.current = false
    initialQuestionPromiseRef.current = null

    // Reset all game progress.
    setQuestion(null)
    setCurrentQuestion(1)
    setSelectedAnswer(null)
    setTimeRemaining(RECOGNITION_TIME)

    setScore(0)
    setCorrectAnswers(0)
    setBestStreak(0)
    setCurrentStreak(0)
    setTotalListeningTime(0)

    setAnsweredSongs([])
    setShowResults(false)
    setError(null)

    // Show loading while fetching a new question for this artist.
    setLoadingComplete(false)
    setIsInitialLoading(true)

    const firstQuestion = await fetchQuestion()

    if (firstQuestion) {
      loadQuestion(firstQuestion)
      setLoadingComplete(true)
    }

    setIsInitialLoading(false)
  }, [
    fetchQuestion,
    loadQuestion,
    stopAudio,
    stopTimer,
  ])

  const fastestSong = useMemo(() => {
    const answered = answeredSongs.filter(song => !song.timedOut)

    if (answered.length === 0) return null

    return answered.reduce((fastest, current) =>
      current.recognitionTime < fastest.recognitionTime
        ? current
        : fastest,
    )
  }, [answeredSongs])

  const slowestSong = useMemo(() => {
    const answered = answeredSongs.filter(song => !song.timedOut)

    if (answered.length === 0) return null

    return answered.reduce((slowest, current) =>
      current.recognitionTime > slowest.recognitionTime
        ? current
        : slowest,
    )
  }, [answeredSongs])

  const resultMessage =
    correctAnswers >= 10
      ? 'That’s a standing ovation score.'
      : correctAnswers >= 7
        ? 'Almost flawless… the crowd’s already cheering.'
        : correctAnswers >= 4
          ? 'Solid effort, you’re halfway to superstar status!'
          : 'Hey, even legends miss a few notes.'

  const confettiCount =
    correctAnswers >= 10
      ? 100
      : correctAnswers >= 7
        ? 65
        : correctAnswers >= 4
          ? 35
          : 12

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: confettiCount }, (_, index) => ({
        id: index,
        x: `${(index * 37) % 101}%`,
        rotation: `${(index * 47) % 360}deg`,
        duration: `${3 + ((index * 13) % 25) / 10}s`,
        delay: `${((index * 17) % 18) / 10}s`,
      })),
    [confettiCount],
  )

  /*
   * Missing artist selection.
   */
  if (!selectedArtist || !selectedArtistId) {
    return (
      <main className="play-by-artist__error-page">
        <div className="play-by-artist__error-card">
          <h1>ARTIST NOT FOUND</h1>
          <p>Please choose an artist before starting this mode.</p>

          <button type="button" onClick={() => navigate('/play')}>
            BACK TO PLAY
          </button>
        </div>
      </main>
    )
  }

  /*
   * Initial loading and Play Again loading screen.
   */
  if (isInitialLoading) {
    return (
      <LoadingScreen
        facts={loadingFacts}
        message={`Loading ${selectedArtist}...`}
        isComplete={loadingComplete}
      />
    )
  }

  /*
   * Failed to load the game.
   */
  if (error && !question) {
    return (
      <main className="play-by-artist__error-page">
        <div className="play-by-artist__error-card">
          <h1>COULD NOT LOAD GAME</h1>
          <p>{error}</p>

          <button type="button" onClick={() => navigate('/play')}>
            BACK TO PLAY
          </button>
        </div>
      </main>
    )
  }

  /*
   * Final results screen.
   */
  if (showResults) {
    const accuracy =
      TOTAL_QUESTIONS > 0
        ? Math.round((correctAnswers / TOTAL_QUESTIONS) * 100)
        : 0

    return (
      <main className="play-by-artist-results">
        <div className="play-by-artist-results__confetti is-celebration">
          {confettiPieces.map(piece => (
            <span
              key={piece.id}
              style={
                {
                  '--confetti-x': piece.x,
                  '--confetti-rotation': piece.rotation,
                  '--confetti-duration': piece.duration,
                  '--confetti-delay': piece.delay,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <div className="play-by-artist-results__container">
          <section className="play-by-artist-results__hero">
            <div className="play-by-artist-results__trophy">
              <Trophy size={42} />
            </div>

            <p className="play-by-artist-results__eyebrow">
              {selectedArtist.toUpperCase()} COMPLETE
            </p>

            <h1 className="play-by-artist-results__title">GAME OVER</h1>

            <p className="play-by-artist-results__subtitle">
              You finished all {TOTAL_QUESTIONS} songs.
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
              <span>ACCURACY</span>
              <strong>{accuracy}%</strong>
            </div>

            <div className="play-by-artist-results__stat">
              <span>CORRECT</span>
              <strong>
                {correctAnswers}/{TOTAL_QUESTIONS}
              </strong>
            </div>

            <div className="play-by-artist-results__stat">
              <span>BEST STREAK</span>
              <strong>{bestStreak}</strong>
            </div>

            <div className="play-by-artist-results__stat">
              <span>LISTENING TIME</span>
              <strong>{totalListeningTime.toFixed(1)}s</strong>
            </div>
          </section>

          {(fastestSong || slowestSong) && (
            <section className="play-by-artist-results__recognition">
              {fastestSong && (
                <div className="play-by-artist-results__recognition-card">
                  <Clock size={20} />

                  <div>
                    <p className="play-by-artist-results__recognition-label">
                      FASTEST RECOGNITION
                    </p>

                    <strong>
                      {fastestSong.recognitionTime.toFixed(1)}s
                    </strong>

                    <span>{fastestSong.question.song.title}</span>
                  </div>
                </div>
              )}

              {slowestSong && (
                <div className="play-by-artist-results__recognition-card">
                  <Clock size={20} />

                  <div>
                    <p className="play-by-artist-results__recognition-label">
                      SLOWEST RECOGNITION
                    </p>

                    <strong>
                      {slowestSong.recognitionTime.toFixed(1)}s
                    </strong>

                    <span>{slowestSong.question.song.title}</span>
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="play-by-artist-results__songs">
            <div className="play-by-artist-results__section-header">
              <p>YOUR RUN</p>
              <span>
                {correctAnswers} / {TOTAL_QUESTIONS} CORRECT
              </span>
            </div>

            <div className="play-by-artist-results__song-list">
              {answeredSongs.map((answeredSong, index) => {
                const song = answeredSong.question.song

                return (
                  <div
                    className="play-by-artist-results__song"
                    key={`${song.id}-${index}`}
                  >
                    <span className="play-by-artist-results__song-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    {song.artworkUrl && (
                      <img
                        className="play-by-artist-results__song-artwork"
                        src={song.artworkUrl}
                        alt=""
                      />
                    )}

                    <div className="play-by-artist-results__song-info">
                      <strong>{song.title}</strong>
                      <span>{song.artist}</span>
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
                          <Check size={16} />
                          <span>+{answeredSong.points}</span>
                        </>
                      ) : answeredSong.timedOut ? (
                        <>
                          <Clock size={16} />
                          <span>TIME</span>
                        </>
                      ) : (
                        <>
                          <X size={16} />
                          <span>MISS</span>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="play-by-artist-results__actions">
            <button
              type="button"
              className="play-by-artist-results__primary-button"
              onClick={() => void handlePlayAgain()}
              disabled={isInitialLoading}
            >
              PLAY AGAIN
            </button>

            <button
              type="button"
              className="play-by-artist-results__secondary-button"
              onClick={() => navigate('/artists')}
            >
              CHOOSE ANOTHER ARTIST
            </button>
          </section>
        </div>
      </main>
    )
  }

  if (!question) return null

  const progress = (currentQuestion / TOTAL_QUESTIONS) * 100
  const answerLocked =
    selectedAnswer !== null || timeRemaining === 0

  const answerIsCorrect =
    selectedAnswer !== null &&
    selectedAnswer !== '' &&
    selectedAnswer.trim().toLowerCase() ===
      question.correctAnswer.trim().toLowerCase()

  return (
    <main
      className={`play-by-artist ${
        answerLocked ? 'has-revealed-answer' : ''
      }`}
    >
      <div className="play-by-artist__container">
        <header className="play-by-artist__header">
          <div className="play-by-artist__header-main">
            <button
              type="button"
              className="play-by-artist__exit-button"
              onClick={handleExit}
              aria-label="Exit game"
            >
              <ArrowLeft size={16} />
              <span>EXIT</span>
            </button>

            <h1 className="play-by-artist__title">
              NAME THAT SONG
            </h1>

            <div className="play-by-artist__artist-badge">
              {selectedArtist}
            </div>
          </div>

          <div className="play-by-artist__header-right">
            <div className="play-by-artist__streak">
              <span>STREAK</span>
              <strong>{currentStreak}</strong>
            </div>

            <div className="play-by-artist__round">
              <span>{String(currentQuestion).padStart(2, '0')}</span>
              <small>
                / {String(TOTAL_QUESTIONS).padStart(2, '0')}
              </small>
            </div>
          </div>
        </header>

        <div
          className="play-by-artist__progress"
          role="progressbar"
          aria-label="Round progress"
          aria-valuemin={0}
          aria-valuemax={TOTAL_QUESTIONS}
          aria-valuenow={currentQuestion}
        >
          <div
            className="play-by-artist__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        <section className="play-by-artist__board">
          <div className="play-by-artist__question-panel">
            <div className="play-by-artist__question-header">
              <span className="play-by-artist__panel-label">
                NOW PLAYING
              </span>

              <div
                className={`play-by-artist__timer ${
                  timeRemaining <= 3 && !answerLocked
                    ? 'is-danger'
                    : ''
                }`}
                aria-label={`${timeRemaining} seconds remaining`}
              >
                <Clock size={16} />
                <span>
                  {String(timeRemaining).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="play-by-artist__question-content">
              {selectedAnswer === null && timeRemaining > 0 ? (
                <>
                  <span className="play-by-artist__question-mark">
                    ?
                  </span>

                  <p className="play-by-artist__question-eyebrow">
                    LISTEN CLOSELY
                  </p>

                  <h2 className="play-by-artist__instruction">
                    Can you name this song?
                  </h2>

                  <p className="play-by-artist__question-description">
                    Listen to the preview and choose the track you
                    recognise.
                  </p>
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
                      <Check size={30} />
                    ) : (
                      <X size={30} />
                    )}
                  </div>

                  <p className="play-by-artist__question-eyebrow">
                    {selectedAnswer === null || selectedAnswer === ''
                      ? 'TIME IS UP'
                      : answerIsCorrect
                        ? 'CORRECT'
                        : 'NOT QUITE'}
                  </p>

                  <h2 className="play-by-artist__revealed-title">
                    {question.song.title}
                  </h2>

                  <p className="play-by-artist__revealed-artist">
                    {question.song.artist}
                  </p>

                  {question.song.album && (
                    <p className="play-by-artist__revealed-album">
                      {question.song.album}
                    </p>
                  )}

                  {question.song.artworkUrl && (
                    <img
                      className="play-by-artist__artwork"
                      src={question.song.artworkUrl}
                      alt={`${
                        question.song.album || question.song.title
                      } artwork`}
                    />
                  )}
                </>
              )}
            </div>

            <div className="play-by-artist__audio">
              <button
                type="button"
                className="play-by-artist__play-button"
                onClick={() => void togglePlayback()}
                disabled={!question.song.audioUrl || answerLocked}
                aria-label={isPlaying ? 'Pause song' : 'Play song'}
              >
                {isPlaying ? (
                  <Pause size={21} />
                ) : (
                  <Play size={21} />
                )}
              </button>

              <div
                className={`play-by-artist__waveform ${
                  isPlaying ? 'is-playing' : ''
                }`}
                aria-hidden="true"
              >
                {Array.from({ length: 32 }, (_, index) => (
                  <span
                    key={index}
                    style={{
                      height: `${20 + ((index * 17) % 60)}%`,
                    }}
                  />
                ))}
              </div>

              <span className="play-by-artist__audio-status">
                {isPlaying
                  ? 'PLAYING'
                  : answerLocked
                    ? 'PREVIEW ENDED'
                    : 'PREVIEW'}
              </span>
            </div>
          </div>

          <div className="play-by-artist__answers-panel">
            <div className="play-by-artist__answers-header">
              <div>
                <p className="play-by-artist__answers-eyebrow">
                  YOUR ANSWER
                </p>

                <p className="play-by-artist__answers-subtitle">
                  Select one track
                </p>
              </div>

              <span className="play-by-artist__answer-count">
                {question.answers.length} OPTIONS
              </span>
            </div>

            <div className="play-by-artist__answers">
              {question.answers.map(answer => {
                const isCorrect =
                  answer.trim().toLowerCase() ===
                  question.correctAnswer.trim().toLowerCase()

                const isSelected = selectedAnswer === answer

                let answerClass = 'play-by-artist__answer'

                if (selectedAnswer !== null) {
                  if (isCorrect) {
                    answerClass += ' is-correct'
                  } else if (isSelected) {
                    answerClass += ' is-incorrect'
                  } else {
                    answerClass += ' is-disabled'
                  }
                }

                return (
                  <button
                    type="button"
                    key={answer}
                    className={answerClass}
                    disabled={answerLocked}
                    onClick={() => handleAnswer(answer)}
                  >
                    <span className="play-by-artist__answer-text">
                      {answer}
                    </span>

                    {selectedAnswer !== null && isCorrect && (
                      <Check
                        size={18}
                        className="play-by-artist__answer-icon"
                      />
                    )}

                    {selectedAnswer !== null &&
                      isSelected &&
                      !isCorrect && (
                        <X
                          size={18}
                          className="play-by-artist__answer-icon"
                        />
                      )}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <div className="play-by-artist__bottom">
          <p
            className={`play-by-artist__play-hint ${
              answerIsCorrect && selectedAnswer !== null
                ? 'is-reward'
                : ''
            }`}
            aria-live="polite"
          >
            {selectedAnswer === null && timeRemaining > 0
              ? 'Choose the song you think you heard.'
              : selectedAnswer === null || selectedAnswer === ''
                ? 'Time is up. Check the answer, then continue.'
                : answerIsCorrect
                  ? (
                    <>
                      <strong>
                        +{calculateArtistPoints(
                          timeRemaining,
                          Math.max(0, currentStreak - 1),
                        )}
                      </strong>
                      <span>POINTS EARNED</span>
                    </>
                  )
                  : `THE ANSWER WAS "${question.correctAnswer.toUpperCase()}"`}
          </p>

          {selectedAnswer !== null && (
            <div className="play-by-artist__next-wrapper">
              <button
                type="button"
                className="play-by-artist__next-button"
                onClick={() => void handleNextQuestion()}
                disabled={loadingNext}
              >
                {loadingNext ? (
                  <>
                    <span className="play-by-artist__button-spinner" />
                    LOADING SONG
                  </>
                ) : currentQuestion === TOTAL_QUESTIONS ? (
                  'SEE RESULTS'
                ) : (
                  'NEXT SONG'
                )}
              </button>
            </div>
          )}
        </div>

        <footer className="play-by-artist__footer">
          <span>{score.toLocaleString()} POINTS</span>
          <span>{correctAnswers} CORRECT</span>
          <span>
            QUESTION {currentQuestion} OF {TOTAL_QUESTIONS}
          </span>
        </footer>
      </div>
    </main>
  )
}
