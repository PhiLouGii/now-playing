
import {
  useCallback,
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
import { calculateFinalPoints } from '../../lib/gameScoring'

import type { Question } from '../../types/game'

import './AlbumGame.css'

const ROUND_LENGTH = 10
const TOTAL_QUESTIONS = 10
const QUESTION_ATTEMPTS = 3

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

type AlbumResultsScreenProps = {
  results: AlbumRecognitionResult[]
  score: number
  bestStreak: number
  onPlayAgain: () => void
  onBack: () => void
}

/*
 * Request a playable question.
 *
 * Failed requests are retried. Previously used tracks and
 * duplicate tracks returned by the API are excluded.
 */
async function requestAlbumQuestion(
  previouslyUsedIds: string[],
): Promise<Question> {
  const excludedIds = new Set(previouslyUsedIds)
  let lastError: unknown

  for (let attempt = 0; attempt < QUESTION_ATTEMPTS; attempt += 1) {
    try {
      const question = await generateQuestion(
        'name-the-album',
        'medium',
        undefined,
        [...excludedIds],
      )

      if (
        !question ||
        !question.song ||
        !question.song.id ||
        !question.song.title ||
        !question.song.artist ||
        !question.song.album ||
        !question.song.audioUrl ||
        !Array.isArray(question.answers) ||
        question.answers.length !== 4 ||
        !question.correctAnswer ||
        !question.answers.includes(question.correctAnswer)
      ) {
        if (question?.song?.id) {
          excludedIds.add(question.song.id)
        }

        throw new Error(
          'The server returned an incomplete album question.',
        )
      }

      if (excludedIds.has(question.song.id)) {
        excludedIds.add(question.song.id)

        throw new Error(
          'The server returned a song that was already used.',
        )
      }

      return question
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Unable to prepare an album question.')
}

function AlbumGame() {
  const navigate = useNavigate()

  const [question, setQuestion] = useState<Question | null>(null)
  const [questionDeck, setQuestionDeck] = useState<Question[]>([])
  const [questionNumber, setQuestionNumber] = useState(1)

  const [timeRemaining, setTimeRemaining] = useState(ROUND_LENGTH)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [isTimeUp, setIsTimeUp] = useState(false)

  const [results, setResults] = useState<AlbumRecognitionResult[]>([])
  const [showResults, setShowResults] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [loadingFacts, setLoadingFacts] = useState<LoadingFact[]>([])
  const [loadingComplete, setLoadingComplete] = useState(false)

  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)

  const scoreSubmitted = useRef(false)
  const isMountedRef = useRef(false)
  const isAdvancingRef = useRef(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<number | null>(null)

  /*
   * Initial setup.
   *
   * Load the first question only. The rest of the round is
   * generated as the player progresses, so one failed request
   * cannot prevent all ten questions from loading.
   */
  const initializeGame = useCallback(async () => {
    setIsLoading(true)
    setLoadingComplete(false)
    setError(null)

    try {
      const firstQuestion = await requestAlbumQuestion([])

      if (!isMountedRef.current) return

      setQuestionDeck([firstQuestion])
      setQuestion(firstQuestion)
      setQuestionNumber(1)
      setTimeRemaining(ROUND_LENGTH)

      setSelectedAnswer(null)
      setHasAnswered(false)
      setIsTimeUp(false)
      setIsPlaying(false)

      setResults([])
      setShowResults(false)

      setScore(0)
      setStreak(0)
      setBestStreak(0)

      scoreSubmitted.current = false
      setLoadingComplete(true)
    } catch {
      if (isMountedRef.current) {
        setError(
          'We could not load an album question. Please try again.',
        )
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true

    void initializeGame()

    getLoadingFacts()
      .then((facts) => {
        if (isMountedRef.current) {
          setLoadingFacts(facts)
        }
      })
      .catch(() => {
        // Facts are optional and must never block gameplay.
      })

    return () => {
      isMountedRef.current = false

      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }

      audioRef.current?.pause()
    }
  }, [initializeGame])

  /*
   * Timer cleanup.
   */
  const clearGameTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /*
   * Record a failed or completed question exactly once.
   */
  const handleTimeUp = useCallback(() => {
    if (hasAnswered || isTimeUp || !question) return

    clearGameTimer()

    setIsTimeUp(true)
    setIsPlaying(false)
    setStreak(0)

    audioRef.current?.pause()

    setResults((previous) => {
      if (
        previous.some(
          (result) => result.questionNumber === questionNumber,
        )
      ) {
        return previous
      }

      return [
        ...previous,
        {
          questionNumber,
          title: question.song.title,
          artist: question.song.artist,
          album: question.song.album,
          artworkUrl: question.song.artworkUrl ?? '',
          recognitionTime: ROUND_LENGTH,
          correct: false,
          points: 0,
        },
      ]
    })
  }, [
    hasAnswered,
    isTimeUp,
    question,
    questionNumber,
    clearGameTimer,
  ])

  /*
   * Countdown only runs while the audio is playing.
   */
  useEffect(() => {
    if (!isPlaying || hasAnswered || isTimeUp) {
      clearGameTimer()
      return
    }

    timerRef.current = window.setInterval(() => {
      setTimeRemaining((previous) => {
        if (previous <= 0.1) {
          clearGameTimer()
          return 0
        }

        return Math.max(0, Number((previous - 0.1).toFixed(1)))
      })
    }, 100)

    return clearGameTimer
  }, [
    isPlaying,
    hasAnswered,
    isTimeUp,
    clearGameTimer,
  ])

  useEffect(() => {
    if (timeRemaining === 0 && isPlaying) {
      handleTimeUp()
    }
  }, [timeRemaining, isPlaying, handleTimeUp])

  /*
   * Save the completed round once.
   */
  useEffect(() => {
    if (
      !showResults ||
      scoreSubmitted.current ||
      results.length < TOTAL_QUESTIONS
    ) {
      return
    }

    scoreSubmitted.current = true

    const correctAnswers = results.filter(
      (result) => result.correct,
    ).length

    const accuracy = (correctAnswers / results.length) * 100

    const totalListeningTime = results.reduce(
      (total, result) => total + result.recognitionTime,
      0,
    )

    async function saveScore() {
      try {
        await submitScore({
          gameMode: 'name-the-album',
          score,
          accuracy,
          bestStreak,
          questions: results.length,
          correctAnswers,
          totalListeningTime,
        })
      } catch (saveError) {
        // A leaderboard failure should not interrupt the results screen.
        console.error('Could not save album game score:', saveError)
      }
    }

    void saveScore()
  }, [showResults, results, score, bestStreak])

  /*
   * Play or pause the current preview.
   */
  function togglePlayback() {
    const audio = audioRef.current

    if (!audio || !question || hasAnswered || isTimeUp) {
      return
    }

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    audio.play()
      .then(() => {
        setIsPlaying(true)
      })
      .catch(() => {
        setIsPlaying(false)
        setError(
          'This preview could not be played. Try another question.',
        )
      })
  }

  /*
   * Submit an answer.
   */
  function handleAnswer(answer: string) {
    if (
      hasAnswered ||
      isTimeUp ||
      !question
    ) {
      return
    }

    const recognitionTime = Math.min(
      ROUND_LENGTH,
      Math.max(0, ROUND_LENGTH - timeRemaining),
    )

    const correct = answer === question.correctAnswer
    const nextStreak = correct ? streak + 1 : 0

    const earnedPoints = correct
      ? calculateFinalPoints(recognitionTime, nextStreak)
      : 0

    clearGameTimer()
    audioRef.current?.pause()

    setSelectedAnswer(answer)
    setHasAnswered(true)
    setIsPlaying(false)
    setStreak(nextStreak)

    if (correct) {
      setBestStreak((currentBest) =>
        Math.max(currentBest, nextStreak),
      )
    }

    setScore((currentScore) => currentScore + earnedPoints)

    setResults((previous) => {
      if (
        previous.some(
          (result) => result.questionNumber === questionNumber,
        )
      ) {
        return previous
      }

      return [
        ...previous,
        {
          questionNumber,
          title: question.song.title,
          artist: question.song.artist,
          album: question.song.album,
          artworkUrl: question.song.artworkUrl ?? '',
          recognitionTime,
          correct,
          points: earnedPoints,
        },
      ]
    })
  }

  /*
   * Load the next question only when the player is ready.
   *
   * If generation fails, the current answer and score are kept.
   * The player can retry without losing progress.
   */
  async function handleNext() {
    if (
      isAdvancingRef.current ||
      isAdvancing
    ) {
      return
    }

    if (questionNumber >= TOTAL_QUESTIONS) {
      setShowResults(true)
      return
    }

    const nextIndex = questionNumber

    const existingQuestion = questionDeck[nextIndex]

    if (existingQuestion) {
      clearGameTimer()
      audioRef.current?.pause()

      setQuestionNumber(nextIndex + 1)
      setQuestion(existingQuestion)
      setSelectedAnswer(null)
      setHasAnswered(false)
      setIsTimeUp(false)
      setIsPlaying(false)
      setTimeRemaining(ROUND_LENGTH)
      setError(null)

      return
    }

    isAdvancingRef.current = true
    setIsAdvancing(true)
    setError(null)

    try {
      const usedIds = questionDeck.map(
        (deckQuestion) => deckQuestion.song.id,
      )

      const nextQuestion = await requestAlbumQuestion(usedIds)

      if (!isMountedRef.current) return

      clearGameTimer()
      audioRef.current?.pause()

      setQuestionDeck((previous) => [
        ...previous,
        nextQuestion,
      ])

      setQuestionNumber(nextIndex + 1)
      setQuestion(nextQuestion)
      setSelectedAnswer(null)
      setHasAnswered(false)
      setIsTimeUp(false)
      setIsPlaying(false)
      setTimeRemaining(ROUND_LENGTH)
      setError(null)
    } catch {
      if (isMountedRef.current) {
        setError(
          'We could not load the next album question. Your progress is safe. Try again.',
        )
      }
    } finally {
      isAdvancingRef.current = false

      if (isMountedRef.current) {
        setIsAdvancing(false)
      }
    }
  }

  /*
   * Retry the first question or the next question.
   */
  function handleRetry() {
    if (!question) {
      void initializeGame()
      return
    }

    setError(null)
    void handleNext()
  }

  function handlePlayAgain() {
    void initializeGame()
  }

  /*
   * Initial loading screen.
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

  /*
   * First-question failure.
   */
  if (!question && error) {
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
          </header>

          <div className="album-game__error-state">
            <p>{error}</p>

            <button
              className="album-game__retry"
              onClick={handleRetry}
              disabled={isLoading}
            >
              <RotateCcw size={18} />
              TRY AGAIN
            </button>

            <button
              className="album-game__retry"
              onClick={() => navigate('/play')}
            >
              BACK TO PLAY
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showResults) {
    return (
      <AlbumResultsScreen
        results={results}
        score={score}
        bestStreak={bestStreak}
        onPlayAgain={handlePlayAgain}
        onBack={() => navigate('/play')}
      />
    )
  }

  if (!question) {
    return null
  }

  const isCorrect = selectedAnswer === question.correctAnswer
  const questionFinished = hasAnswered || isTimeUp

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
              {String(questionNumber).padStart(2, '0')}
            </span>
            <span>
              / {String(TOTAL_QUESTIONS).padStart(2, '0')}
            </span>
          </div>
        </header>

        {error && (
          <div className="album-game__error-state" role="alert">
            <p>{error}</p>

            <button
              className="album-game__retry"
              onClick={handleRetry}
              disabled={isAdvancing}
            >
              <RotateCcw size={18} />
              TRY AGAIN
            </button>
          </div>
        )}

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
                timeRemaining <= 3 && !questionFinished
                  ? 'album-game__timer--urgent'
                  : ''
              }
            >
              {timeRemaining.toFixed(1)}s
            </strong>
          </div>

          <div className="album-game__wave">
            {Array.from({ length: 32 }, (_, index) => (
              <span
                key={index}
                className={
                  isPlaying
                    ? 'album-game__wave-bar album-game__wave-bar--active'
                    : 'album-game__wave-bar'
                }
              />
            ))}
          </div>

          <button
            className="album-game__play"
            onClick={togglePlayback}
            disabled={questionFinished}
            aria-label={isPlaying ? 'Pause song' : 'Play song'}
          >
            {isPlaying ? (
              <Pause size={30} fill="currentColor" />
            ) : (
              <Play size={30} fill="currentColor" />
            )}
          </button>

          <div className="album-game__player-bottom">
            <Volume2 size={15} />

            <div className="album-game__progress-track">
              <div
                className="album-game__progress-fill"
                style={{
                  width: `${
                    ((ROUND_LENGTH - timeRemaining) / ROUND_LENGTH) * 100
                  }%`,
                }}
              />
            </div>

            <span>10s</span>
          </div>

          <audio
            key={question.song.id}
            ref={audioRef}
            src={question.song.audioUrl}
            preload="auto"
            onEnded={() => setIsPlaying(false)}
            onError={() => {
              if (!questionFinished) {
                setIsPlaying(false)
              }
            }}
          />
        </section>

        {questionFinished ? (
          <section className="album-game__reveal">
            <div className="album-game__reveal-art">
              {question.song.artworkUrl ? (
                <img
                  src={question.song.artworkUrl}
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
                  : isCorrect
                    ? 'CORRECT'
                    : 'NOT QUITE'}
              </p>

              <h2>{question.song.album}</h2>

              <p>
                {question.song.artist}
                {' · '}
                {question.song.title}
              </p>
            </div>

            <div
              className={`album-game__result ${
                isCorrect
                  ? 'album-game__result--correct'
                  : 'album-game__result--wrong'
              }`}
            >
              {isCorrect ? '✓' : '×'}
            </div>
          </section>
        ) : (
          <section className="album-game__answers">
            <div className="album-game__answers-header">
              <p>SELECT THE ALBUM</p>
              <span>4 CHOICES</span>
            </div>

            <div className="album-game__answer-grid">
              {question.answers.map((answer, index) => (
                <button
                  key={`${question.id}-${answer}`}
                  className="album-game__answer"
                  onClick={() => handleAnswer(answer)}
                  disabled={isAdvancing}
                >
                  <span className="album-game__answer-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="album-game__answer-text">
                    {answer}
                  </span>

                  <ArrowRight
                    size={18}
                    className="album-game__answer-arrow"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {questionFinished && (
          <button
            className="album-game__next"
            onClick={() => void handleNext()}
            disabled={isAdvancing}
          >
            <span>
              {isAdvancing
                ? 'LOADING NEXT QUESTION...'
                : questionNumber >= TOTAL_QUESTIONS
                  ? 'SEE RESULTS'
                  : 'NEXT SONG'}
            </span>

            {isAdvancing ? (
              <span aria-hidden="true">…</span>
            ) : (
              <ArrowRight size={19} />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function AlbumResultsScreen({
  results,
  score,
  bestStreak,
  onPlayAgain,
  onBack,
}: AlbumResultsScreenProps) {
  const correctResults = results.filter(
    (result) => result.correct,
  )

  const recognizedCount = correctResults.length

  const accuracy = results.length > 0
    ? Math.round((recognizedCount / results.length) * 100)
    : 0

  const recognitionTimes = correctResults.map(
    (result) => result.recognitionTime,
  )

  const averageTime = recognitionTimes.length > 0
    ? recognitionTimes.reduce((total, time) => total + time, 0) /
      recognitionTimes.length
    : 0

  const fastestTime = recognitionTimes.length > 0
    ? Math.min(...recognitionTimes)
    : 0

  const fastestResult = correctResults.find(
    (result) => result.recognitionTime === fastestTime,
  )

  return (
    <div className="album-results">
      <div className="album-results__container">
        <header className="album-results__header">
          <div className="album-results__trophy">
            <Trophy size={28} />
          </div>

          <div>
            <p className="album-results__eyebrow">
              ROUND COMPLETE
            </p>

            <h1>You know your albums.</h1>

            <p>
              You recognized <strong>{recognizedCount}</strong>{' '}
              out of {results.length}.
            </p>
          </div>
        </header>

        <section className="album-results__score">
          <div>
            <span>FINAL SCORE</span>
            <strong>{score}</strong>
          </div>

          <div>
            <span>ALBUMS RECOGNIZED</span>
            <strong>
              {recognizedCount}
              <small>/{results.length}</small>
            </strong>
          </div>

          <div>
            <span>ACCURACY</span>
            <strong>{accuracy}%</strong>
          </div>

          <div>
            <span>BEST STREAK</span>
            <strong>{bestStreak}</strong>
          </div>
        </section>

        <section className="album-results__speed">
          <div className="album-results__section-heading">
            <p>RECOGNITION SPEED</p>
            <span>YOUR LISTENING STATS</span>
          </div>

          <div className="album-results__speed-grid">
            <div>
              <span>AVERAGE TIME</span>
              <strong>
                {recognitionTimes.length > 0
                  ? `${averageTime.toFixed(1)}s`
                  : '—'}
              </strong>
            </div>

            <div>
              <span>FASTEST TIME</span>
              <strong>
                {fastestTime > 0
                  ? `${fastestTime.toFixed(1)}s`
                  : '—'}
              </strong>
            </div>

            <div>
              <span>FASTEST ALBUM</span>
              <strong>
                {fastestResult?.album ?? '—'}
              </strong>
            </div>
          </div>
        </section>

        <section className="album-results__breakdown">
          <div className="album-results__section-heading">
            <p>ROUND BREAKDOWN</p>
            <span>{results.length} QUESTIONS</span>
          </div>

          <div className="album-results__list">
            {results.map((result) => (
              <div
                className="album-results__item"
                key={result.questionNumber}
              >
                <span className="album-results__number">
                  {String(result.questionNumber).padStart(2, '0')}
                </span>

                <div className="album-results__art">
                  {result.artworkUrl ? (
                    <img src={result.artworkUrl} alt="" />
                  ) : (
                    <span>?</span>
                  )}
                </div>

                <div className="album-results__info">
                  <strong>{result.album}</strong>
                  <span>
                    {result.artist} · {result.title}
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
                    ? `+${result.points} · ${result.recognitionTime.toFixed(1)}s ✓`
                    : 'MISSED ×'}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="album-results__actions">
          <button
            className="album-results__primary"
            onClick={onPlayAgain}
          >
            <RotateCcw size={17} />
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
