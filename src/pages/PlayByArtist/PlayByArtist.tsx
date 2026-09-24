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

import { generateQuestion } from '../../services/gameService'
import { submitScore } from '../../services/scoreService'
import {
  calculateFinalPoints,
} from '../../lib/gameScoring'
import type { Question } from '../../types/game'

import './PlayByArtist.css'

const TOTAL_QUESTIONS = 10
const RECOGNITION_TIME = 10

type AnswerStatus =
  | 'idle'
  | 'correct'
  | 'incorrect'
  | 'timeout'

type RecognitionResult = {
  questionNumber: number
  songTitle: string
  artist: string
  selectedAnswer: string | null
  correct: boolean
  points: number
  listeningTime: number
}

function PlayByArtistResultsScreen({
  results,
  score,
  bestStreak,
  onPlayAgain,
  onBackToPlay,
}: {
  results: RecognitionResult[]
  score: number
  bestStreak: number
  onPlayAgain: () => void
  onBackToPlay: () => void
}) {
  const correctAnswers = results.filter(
    (result) => result.correct,
  ).length

  const accuracy =
    results.length > 0
      ? Math.round(
          (correctAnswers / results.length) * 100,
        )
      : 0

  const recognizedResults = results.filter(
    (result) => result.correct,
  )

  const averageRecognitionTime =
    recognizedResults.length > 0
      ? recognizedResults.reduce(
          (total, result) =>
            total + result.listeningTime,
          0,
        ) / recognizedResults.length
      : 0

  const fastestResult =
    recognizedResults.length > 0
      ? recognizedResults.reduce(
          (fastest, result) =>
            result.listeningTime <
            fastest.listeningTime
              ? result
              : fastest,
        )
      : null

  return (
    <div className="play-by-artist-results">
      <div className="play-by-artist-results__container">
        <div className="play-by-artist-results__hero">
          <div className="play-by-artist-results__trophy">
            <Trophy size={28} />
          </div>

          <p className="play-by-artist-results__eyebrow">
            ROUND COMPLETE
          </p>

          <h1 className="play-by-artist-results__title">
            Name That Song
          </h1>

          <p className="play-by-artist-results__subtitle">
            You made it through all {TOTAL_QUESTIONS}{' '}
            songs.
          </p>
        </div>

        <div className="play-by-artist-results__score-card">
          <span className="play-by-artist-results__score-label">
            FINAL SCORE
          </span>

          <strong className="play-by-artist-results__score">
            {score.toLocaleString()}
          </strong>
        </div>

        <div className="play-by-artist-results__stats">
          <div className="play-by-artist-results__stat">
            <span>SONGS RECOGNIZED</span>
            <strong>
              {correctAnswers}/{TOTAL_QUESTIONS}
            </strong>
          </div>

          <div className="play-by-artist-results__stat">
            <span>ACCURACY</span>
            <strong>{accuracy}%</strong>
          </div>

          <div className="play-by-artist-results__stat">
            <span>BEST STREAK</span>
            <strong>{bestStreak}</strong>
          </div>

          <div className="play-by-artist-results__stat">
            <span>AVG. RECOGNITION</span>
            <strong>
              {averageRecognitionTime > 0
                ? `${averageRecognitionTime.toFixed(1)}s`
                : '—'}
            </strong>
          </div>
        </div>

        {fastestResult && (
          <div className="play-by-artist-results__fastest">
            <div>
              <span className="play-by-artist-results__fastest-label">
                FASTEST RECOGNITION
              </span>

              <strong>
                {fastestResult.songTitle}
              </strong>

              <small>
                {fastestResult.artist}
              </small>
            </div>

            <span className="play-by-artist-results__fastest-time">
              {fastestResult.listeningTime.toFixed(1)}s
            </span>
          </div>
        )}

        <div className="play-by-artist-results__songs">
          <div className="play-by-artist-results__section-header">
            <h2>Your Songs</h2>
            <span>
              {correctAnswers} recognized
            </span>
          </div>

          <div className="play-by-artist-results__song-list">
            {results.map((result) => (
              <div
                key={result.questionNumber}
                className={`play-by-artist-results__song ${
                  result.correct
                    ? 'is-correct'
                    : 'is-incorrect'
                }`}
              >
                <div className="play-by-artist-results__song-number">
                  {String(
                    result.questionNumber,
                  ).padStart(2, '0')}
                </div>

                <div className="play-by-artist-results__song-info">
                  <strong>
                    {result.songTitle}
                  </strong>

                  <span>{result.artist}</span>
                </div>

                <div className="play-by-artist-results__song-result">
                  {result.correct ? (
                    <>
                      <Check size={16} />
                      <span>
                        +{result.points}
                      </span>
                    </>
                  ) : (
                    <>
                      <X size={16} />
                      <span>Missed</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="play-by-artist-results__actions">
          <button
            className="play-by-artist-results__primary-button"
            onClick={onPlayAgain}
          >
            <RotateCcw size={18} />
            PLAY AGAIN
          </button>

          <button
            className="play-by-artist-results__secondary-button"
            onClick={onBackToPlay}
          >
            BACK TO PLAY
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PlayByArtist() {
  const location = useLocation()
  const navigate = useNavigate()

  const rawArtist = (
    location.state as {
      artist?: string
    } | null
  )?.artist

  const selectedArtist =
    typeof rawArtist === 'string'
      ? rawArtist.trim()
      : ''

  const audioRef = useRef<HTMLAudioElement | null>(
    null,
  )

  const excludedTrackIdsRef = useRef<string[]>([])

  const scoreSubmittedRef = useRef(false)

  /*
   * Prevents React development Strict Mode from
   * requesting the first question twice.
   */
  const initialLoadArtistRef =
    useRef<string | null>(null)

  /*
   * The next question is fetched in the background
   * while the player is answering the current one.
   */
  const nextQuestionRef =
    useRef<Question | null>(null)

  const nextQuestionLoadingRef =
    useRef(false)

  const [question, setQuestion] =
    useState<Question | null>(null)

  const [currentQuestion, setCurrentQuestion] =
    useState(0)

  const [loading, setLoading] =
    useState(true)

  const [loadingNext, setLoadingNext] =
    useState(false)

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null)

  const [answerStatus, setAnswerStatus] =
    useState<AnswerStatus>('idle')

  const [timeRemaining, setTimeRemaining] =
    useState(RECOGNITION_TIME)

  const [isPlaying, setIsPlaying] =
    useState(false)

  const [score, setScore] = useState(0)

  const [streak, setStreak] = useState(0)

  const [bestStreak, setBestStreak] =
    useState(0)

  const [recognitionResults, setRecognitionResults] =
    useState<RecognitionResult[]>([])

  const [isGameComplete, setIsGameComplete] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  /*
   * Fetches a question from the backend and reserves
   * its track ID immediately.
   */
  const fetchQuestion = async () => {
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

    const trackId = String(
      nextQuestion.song.id,
    )

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
   * Loads the first question.
   */
  const loadInitialQuestion = async () => {
    if (!selectedArtist) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const firstQuestion =
        await fetchQuestion()

      if (!firstQuestion) {
        throw new Error(
          'Could not load the first song.',
        )
      }

      setQuestion(firstQuestion)

      /*
       * Start preparing Question 2 immediately.
       * The player doesn't need to wait for it.
       */
      if (TOTAL_QUESTIONS > 1) {
        void preloadNextQuestion()
      }
    } catch (err) {
      console.error(
        'Failed to load artist question:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load the first song.',
      )
    } finally {
      setLoading(false)
    }
  }

  /*
   * Fetches the next question in the background.
   *
   * Because fetchQuestion() adds the track ID to the
   * exclusion list immediately, the current and next
   * questions cannot accidentally use the same song.
   */
  const preloadNextQuestion = async () => {
    if (
      !selectedArtist ||
      nextQuestionLoadingRef.current ||
      nextQuestionRef.current
    ) {
      return
    }

    /*
     * Never preload beyond the final question.
     */
    if (
      currentQuestion + 1 >=
      TOTAL_QUESTIONS
    ) {
      return
    }

    nextQuestionLoadingRef.current = true

    try {
      const preloadedQuestion =
        await fetchQuestion()

      nextQuestionRef.current =
        preloadedQuestion
    } catch (err) {
      /*
       * This is intentionally silent here.
       * If preloading fails, NEXT SONG can fall back
       * to fetching the question when needed.
       */
      console.error(
        'Failed to preload next artist question:',
        err,
      )
    } finally {
      nextQuestionLoadingRef.current = false
    }
  }

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

    loadInitialQuestion()
  }, [selectedArtist])

  useEffect(() => {
    if (
      !isPlaying ||
      answerStatus !== 'idle' ||
      !question
    ) {
      return
    }

    if (timeRemaining <= 0) {
      handleTimeout()
      return
    }

    const timer = window.setTimeout(() => {
      setTimeRemaining(
        (previous) => previous - 1,
      )
    }, 1000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [
    isPlaying,
    answerStatus,
    timeRemaining,
    question,
  ])

  useEffect(() => {
    if (
      !isGameComplete ||
      scoreSubmittedRef.current ||
      recognitionResults.length <
        TOTAL_QUESTIONS
    ) {
      return
    }

    scoreSubmittedRef.current = true

    const correctAnswers =
      recognitionResults.filter(
        (result) => result.correct,
      ).length

    const accuracy =
      Math.round(
        (correctAnswers /
          TOTAL_QUESTIONS) *
          100,
      )

    const totalListeningTime =
      recognitionResults.reduce(
        (total, result) =>
          total + result.listeningTime,
        0,
      )

    submitScore({
      gameMode: 'name-that-song',
      score,
      accuracy,
      bestStreak,
      questions: TOTAL_QUESTIONS,
      correctAnswers,
      totalListeningTime,
    }).catch((submitError) => {
      console.error(
        'Failed to submit score:',
        submitError,
      )
    })
  }, [
    isGameComplete,
    recognitionResults,
    score,
    bestStreak,
  ])

  const startAudio = async () => {
    if (!audioRef.current || !question) {
      return
    }

    try {
      await audioRef.current.play()
      setIsPlaying(true)
    } catch (err) {
      console.error(
        'Failed to play audio:',
        err,
      )
    }
  }

  const pauseAudio = () => {
    if (!audioRef.current) {
      return
    }

    audioRef.current.pause()
    setIsPlaying(false)
  }

  const finishRoundIfNeeded = () => {
    if (
      currentQuestion + 1 >=
      TOTAL_QUESTIONS
    ) {
      setIsGameComplete(true)
      setIsPlaying(false)

      if (audioRef.current) {
        audioRef.current.pause()
      }

      return true
    }

    return false
  }

  const handleAnswer = (
    answer: string,
  ) => {
    if (
      !question ||
      answerStatus !== 'idle' ||
      !isPlaying
    ) {
      return
    }

    const isCorrect =
      answer === question.correctAnswer

    const listeningTime =
      RECOGNITION_TIME - timeRemaining

    const nextStreak = isCorrect
      ? streak + 1
      : 0

    const points = isCorrect
      ? calculateFinalPoints(
          listeningTime,
          nextStreak,
        )
      : 0

    if (audioRef.current) {
      audioRef.current.pause()
    }

    setIsPlaying(false)
    setSelectedAnswer(answer)

    setAnswerStatus(
      isCorrect
        ? 'correct'
        : 'incorrect',
    )

    setStreak(nextStreak)

    if (nextStreak > bestStreak) {
      setBestStreak(nextStreak)
    }

    if (isCorrect) {
      setScore(
        (previous) => previous + points,
      )
    }

    setRecognitionResults(
      (previous) => [
        ...previous,
        {
          questionNumber:
            currentQuestion + 1,
          songTitle:
            question.correctAnswer,
          artist: question.song.artist,
          selectedAnswer: answer,
          correct: isCorrect,
          points,
          listeningTime,
        },
      ],
    )

    /*
     * The next question should already be loading
     * or already be waiting in nextQuestionRef.
     */
    void preloadNextQuestion()
  }

  const handleTimeout = () => {
    if (
      !question ||
      answerStatus !== 'idle'
    ) {
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    setIsPlaying(false)
    setAnswerStatus('timeout')
    setSelectedAnswer(null)
    setStreak(0)

    setRecognitionResults(
      (previous) => [
        ...previous,
        {
          questionNumber:
            currentQuestion + 1,
          songTitle:
            question.correctAnswer,
          artist: question.song.artist,
          selectedAnswer: null,
          correct: false,
          points: 0,
          listeningTime:
            RECOGNITION_TIME,
        },
      ],
    )

    void preloadNextQuestion()
  }

  const handleNextQuestion = async () => {
    const roundFinished =
      finishRoundIfNeeded()

    if (roundFinished) {
      return
    }

    setLoadingNext(true)
    setError(null)

    try {
      let upcomingQuestion =
        nextQuestionRef.current

      /*
       * Normally this already exists because it was
       * preloaded during the previous question.
       *
       * If the network was slow and it isn't ready yet,
       * fall back to fetching it here.
       */
      if (!upcomingQuestion) {
        upcomingQuestion =
          await fetchQuestion()
      }

      if (!upcomingQuestion) {
        throw new Error(
          'Could not load the next song.',
        )
      }

      /*
       * Remove the consumed question from the buffer.
       */
      nextQuestionRef.current = null

      setQuestion(upcomingQuestion)

      setCurrentQuestion(
        (previous) => previous + 1,
      )

      setSelectedAnswer(null)
      setAnswerStatus('idle')
      setTimeRemaining(RECOGNITION_TIME)
      setIsPlaying(false)

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      /*
       * Begin loading the following question while
       * the player is listening to this one.
       */
      void preloadNextQuestion()
    } catch (err) {
      console.error(
        'Failed to load next artist question:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load the next song.',
      )
    } finally {
      setLoadingNext(false)
    }
  }

  const handlePlayAgain = () => {
    navigate('/play-by-artist', {
      state: {
        artist: selectedArtist,
      },
      replace: true,
    })
  }

  if (!selectedArtist) {
    return (
      <div className="play-by-artist__error-page">
        <div className="play-by-artist__error-card">
          <span className="play-by-artist__eyebrow">
            PLAY BY ARTIST
          </span>

          <h1>No artist selected</h1>

          <p>
            Choose an artist from the Play page
            before starting this game.
          </p>

          <button
            onClick={() => navigate('/play')}
          >
            BACK TO PLAY
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }

  if (isGameComplete) {
    return (
      <PlayByArtistResultsScreen
        results={recognitionResults}
        score={score}
        bestStreak={bestStreak}
        onPlayAgain={handlePlayAgain}
        onBackToPlay={() =>
          navigate('/play')
        }
      />
    )
  }

  if (loading) {
    return (
      <div className="play-by-artist__loading-page">
        <div className="play-by-artist__loading-content">
          <div className="play-by-artist__loading-spinner" />
          <p>
            Finding a {selectedArtist} song...
          </p>
        </div>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="play-by-artist__error-page">
        <div className="play-by-artist__error-card">
          <span className="play-by-artist__eyebrow">
            PLAY BY ARTIST
          </span>

          <h1>Couldn't load the song</h1>

          <p>
            {error ??
              'Something went wrong while loading this round.'}
          </p>

          <div className="play-by-artist__error-actions">
            <button
              onClick={() =>
                loadInitialQuestion()
              }
            >
              TRY AGAIN
              <RotateCcw size={18} />
            </button>

            <button
              className="secondary"
              onClick={() =>
                navigate('/play')
              }
            >
              BACK TO PLAY
            </button>
          </div>
        </div>
      </div>
    )
  }

  const hasAnswered =
    answerStatus !== 'idle'

  const progress =
    ((currentQuestion + 1) /
      TOTAL_QUESTIONS) *
    100

  return (
    <div className="play-by-artist">
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
              <span>PLAYING</span>
              <strong>
                {selectedArtist}
              </strong>
            </div>
          </div>

          <div className="play-by-artist__header-right">
            <div className="play-by-artist__streak">
              <span>STREAK</span>
              <strong>{streak}</strong>
            </div>

            <div className="play-by-artist__round">
              <span>ROUND</span>
              <strong>
                {currentQuestion + 1}/
                {TOTAL_QUESTIONS}
              </strong>
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

        <main className="play-by-artist__board">
          <section className="play-by-artist__question-panel">
            <div className="play-by-artist__question-header">
              <span>
                SONG {currentQuestion + 1}
              </span>

              <span
                className={`play-by-artist__timer ${
                  timeRemaining <= 3 &&
                  isPlaying
                    ? 'is-danger'
                    : ''
                }`}
              >
                {timeRemaining}s
              </span>
            </div>

            <div className="play-by-artist__question-content">
              {!hasAnswered ? (
                <>
                  <div className="play-by-artist__question-mark">
                    ?
                  </div>

                  <p className="play-by-artist__question-eyebrow">
                    NAME THE SONG
                  </p>

                  <h2>
                    Which song by{' '}
                    <span>
                      {selectedArtist}
                    </span>{' '}
                    is this?
                  </h2>

                  <p className="play-by-artist__instruction">
                    Press play and identify the
                    song as quickly as you can.
                  </p>
                </>
              ) : (
                <>
                  <div
                    className={`play-by-artist__result-icon ${
                      answerStatus === 'correct'
                        ? 'is-correct'
                        : 'is-incorrect'
                    }`}
                  >
                    {answerStatus ===
                    'correct' ? (
                      <Check size={34} />
                    ) : (
                      <X size={34} />
                    )}
                  </div>

                  <p className="play-by-artist__question-eyebrow">
                    {answerStatus ===
                    'correct'
                      ? 'YOU GOT IT'
                      : 'THE SONG WAS'}
                  </p>

                  <h2 className="play-by-artist__revealed-title">
                    {question.correctAnswer}
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
                      src={
                        question.song.artworkUrl
                      }
                      alt={
                        question.correctAnswer
                      }
                    />
                  )}
                </>
              )}
            </div>

            <div className="play-by-artist__audio">
              <audio
                ref={audioRef}
                src={question.song.audioUrl}
                preload="auto"
                onEnded={() =>
                  setIsPlaying(false)
                }
              />

              <button
                className={`play-by-artist__play-button ${
                  isPlaying
                    ? 'is-playing'
                    : ''
                }`}
                onClick={
                  isPlaying
                    ? pauseAudio
                    : startAudio
                }
                disabled={hasAnswered}
                aria-label={
                  isPlaying
                    ? 'Pause song'
                    : 'Play song'
                }
              >
                {isPlaying ? (
                  <Pause size={28} />
                ) : (
                  <Play
                    size={28}
                    fill="currentColor"
                  />
                )}
              </button>

              <div className="play-by-artist__waveform">
                {Array.from({
                  length: 28,
                }).map((_, index) => (
                  <span
                    key={index}
                    style={{
                      height: `${
                        20 +
                        ((index * 17) % 45)
                      }%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </section>

          <aside className="play-by-artist__answers-panel">
            <div className="play-by-artist__answers-header">
              <span className="play-by-artist__answers-eyebrow">
                YOUR ANSWER
              </span>

              <span>
                {timeRemaining}s
              </span>
            </div>

            <div className="play-by-artist__answers">
              {question.answers.map(
                (answer, index) => {
                  const isSelected =
                    selectedAnswer ===
                    answer

                  const isCorrect =
                    answer ===
                    question.correctAnswer

                  let answerClass =
                    'play-by-artist__answer'

                  if (hasAnswered) {
                    if (isCorrect) {
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
                      key={answer}
                      className={answerClass}
                      onClick={() =>
                        handleAnswer(
                          answer,
                        )
                      }
                      disabled={
                        hasAnswered ||
                        !isPlaying
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

                      {hasAnswered &&
                        isCorrect && (
                          <Check
                            size={18}
                          />
                        )}

                      {hasAnswered &&
                        isSelected &&
                        !isCorrect && (
                          <X size={18} />
                        )}
                    </button>
                  )
                },
              )}
            </div>

            {!isPlaying &&
              !hasAnswered && (
                <p className="play-by-artist__play-hint">
                  Press play to unlock your
                  answers.
                </p>
              )}

            {hasAnswered && (
              <div className="play-by-artist__next-wrapper">
                <button
                  className="play-by-artist__next-button"
                  onClick={
                    handleNextQuestion
                  }
                  disabled={loadingNext}
                >
                  {currentQuestion + 1 >=
                  TOTAL_QUESTIONS
                    ? 'SEE RESULTS'
                    : 'NEXT SONG'}

                  {loadingNext ? (
                    <span className="play-by-artist__button-spinner" />
                  ) : (
                    <ArrowRight size={18} />
                  )}
                </button>
              </div>
            )}
          </aside>
        </main>

        <footer className="play-by-artist__footer">
          <span>
            {score.toLocaleString()} POINTS
          </span>

          <span>
            {recognitionResults.filter(
              (result) => result.correct,
            ).length}{' '}
            CORRECT
          </span>
        </footer>
      </div>
    </div>
  )
}

