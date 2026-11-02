import { useEffect, useRef, useState } from 'react'
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
import type { Question } from '../../types/game'

import './YearGame.css'

const TOTAL_QUESTIONS = 10
const MAX_ATTEMPTS = 3
const ATTEMPT_POINTS = [1000, 700, 400]

type YearRecognitionResult = {
  questionNumber: number
  title: string
  artist: string
  album: string
  artworkUrl: string
  releaseYear: number
  recognitionTime: number
  attempts: number
  correct: boolean
  points: number
}

type AttemptStatus = 'wrong' | 'correct'

function YearGame() {
  const navigate = useNavigate()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const scoreSubmitted = useRef(false)

  const [question, setQuestion] = useState<Question | null>(null)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const [answerInput, setAnswerInput] = useState('')
  const [attemptStatuses, setAttemptStatuses] = useState<AttemptStatus[]>([])
  const [guessedYears, setGuessedYears] = useState<string[]>([])
  const [hasAnswered, setHasAnswered] = useState(false)

  const [results, setResults] = useState<YearRecognitionResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [loadingFacts, setLoadingFacts] = useState<LoadingFact[]>([])
  const [loadingComplete, setLoadingComplete] = useState(false)

  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function initializeGame() {
      setIsLoading(true)
      setLoadingComplete(false)

      getLoadingFacts()
        .then((data) => {
          if (isMounted) setLoadingFacts(data.facts)
        })
        .catch((err) => {
          console.error('Failed to load loading facts:', err)
        })

      await loadQuestion(isMounted, true)
    }

    void initializeGame()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  useEffect(() => {
    if (!showResults || scoreSubmitted.current || results.length < TOTAL_QUESTIONS) {
      return
    }

    scoreSubmitted.current = true

    const correctAnswers = results.filter((result) => result.correct).length
    const accuracy = (correctAnswers / TOTAL_QUESTIONS) * 100
    const totalListeningTime = results.reduce(
      (total, result) => total + result.recognitionTime,
      0,
    )

    async function saveScore() {
      try {
        await submitScore({
          gameMode: 'guess-the-year',
          score,
          accuracy,
          bestStreak,
          questions: TOTAL_QUESTIONS,
          correctAnswers,
          totalListeningTime,
        })
      } catch (err) {
        console.error('Failed to save year game score:', err)
      }
    }

    void saveScore()
  }, [showResults, results, score, bestStreak])

  async function loadQuestion(isMounted = true, isInitialLoad = false) {
    setIsLoading(true)
    setError(null)
    setQuestion(null)
    setAnswerInput('')
    setAttemptStatuses([])
    setGuessedYears([])
    setHasAnswered(false)
    setIsPlaying(false)
    setPlaybackProgress(0)
    audioRef.current?.pause()

    try {
      const generatedQuestion = await generateQuestion('guess-the-year', 'medium')

      if (!isMounted) return

      setQuestion(generatedQuestion)
      if (isInitialLoad) setLoadingComplete(true)
    } catch (err) {
      console.error('Failed to generate year question:', err)
      if (isMounted) {
        setError('We could not load the next song. Please try again.')
      }
    } finally {
      if (isMounted) setIsLoading(false)
    }
  }

  function togglePlayback() {
    const audio = audioRef.current
    if (!audio || !question || hasAnswered) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    audio.play()
      .then(() => setIsPlaying(true))
      .catch((err) => console.error('Unable to play preview:', err))
  }

  function handleAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (hasAnswered || !question) return

    const answer = answerInput.trim()
    if (!/^\d{4}$/.test(answer)) return

    const attemptNumber = attemptStatuses.length + 1
    const correct = answer === String(question.correctAnswer)
    const nextStatuses: AttemptStatus[] = [
      ...attemptStatuses,
      correct ? 'correct' : 'wrong',
    ]

    setAttemptStatuses(nextStatuses)
setGuessedYears((previous) => [
  ...previous,
  answer,
])
setAnswerInput('')

    // A wrong first or second guess uses an attempt but does not end the question.
    if (!correct && attemptNumber < MAX_ATTEMPTS) return

    const earnedPoints = correct ? ATTEMPT_POINTS[attemptNumber - 1] : 0
    const nextStreak = correct ? streak + 1 : 0
    const recognitionTime = audioRef.current?.currentTime ?? 0

    setHasAnswered(true)
    setIsPlaying(false)
    setStreak(nextStreak)

    if (correct) {
      setBestStreak((currentBest) => Math.max(currentBest, nextStreak))
    }

    setScore((currentScore) => currentScore + earnedPoints)
    audioRef.current?.pause()

    setResults((previous) => [
      ...previous,
      {
        questionNumber,
        title: question.song.title,
        artist: question.song.artist,
        album: question.song.album,
        artworkUrl: question.song.artworkUrl,
        releaseYear: question.song.releaseYear!,
        recognitionTime,
        attempts: attemptNumber,
        correct,
        points: earnedPoints,
      },
    ])
  }

  async function handleNext() {
    if (questionNumber >= TOTAL_QUESTIONS) {
      setShowResults(true)
      return
    }

    setQuestionNumber((current) => current + 1)
    await loadQuestion()
  }

  function handleRetry() {
    void loadQuestion()
  }

  function handlePlayAgain() {
    window.location.reload()
  }

  if (isLoading && !question) {
    return (
      <LoadingScreen
        facts={loadingFacts}
        message="Loading Guess the Year..."
        isComplete={loadingComplete}
      />
    )
  }

  if (showResults) {
    return (
      <YearResultsScreen
        results={results}
        score={score}
        bestStreak={bestStreak}
        onPlayAgain={handlePlayAgain}
        onBack={() => navigate('/play')}
      />
    )
  }

  return (
    <div className="year-game">
      <div className="year-game__container">
        <header className="year-game__header">
          <div>
            <p className="year-game__eyebrow">GUESS THE YEAR</p>
            <h1 className="year-game__title">When was it released?</h1>
          </div>

          <div className="year-game__progress">
            <span>{String(questionNumber).padStart(2, '0')}</span>
            <span>/ {String(TOTAL_QUESTIONS).padStart(2, '0')}</span>
          </div>
        </header>

        {isLoading && (
          <div className="year-game__loading">
            <div className="year-game__loading-spinner" />
            <p>Finding your next song...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="year-game__error-state">
            <p>{error}</p>
            <button className="year-game__retry" onClick={handleRetry}>
              <RotateCcw size={16} /> TRY AGAIN
            </button>
          </div>
        )}

        {question && !isLoading && !error && (
          <main className="year-game__board">
            <section className="year-game__question">
              <div className="year-game__artwork">
                <div className="year-game__artwork-placeholder">
                  <span>?</span>
                </div>
              </div>

              <div className="year-game__audio">
                <div className="year-game__audio-top">
                  <span>{hasAnswered ? 'ANSWER LOCKED' : 'LISTEN'}</span>
                  <strong>UP TO 30 SECONDS</strong>
                </div>

                <div className="year-game__wave">
                  {Array.from({ length: 28 }, (_, index) => (
                    <span
                      key={index}
                      className={
                        isPlaying
                          ? 'year-game__wave-bar year-game__wave-bar--active'
                          : 'year-game__wave-bar'
                      }
                    />
                  ))}
                </div>

                <button
                  className="year-game__play"
                  onClick={togglePlayback}
                  disabled={hasAnswered}
                  aria-label={isPlaying ? 'Pause song' : 'Play song'}
                >
                  {isPlaying ? (
                    <Pause size={20} fill="currentColor" />
                  ) : (
                    <Play size={20} fill="currentColor" />
                  )}
                </button>

                <div className="year-game__player-bottom">
                  <Volume2 size={14} />
                  <div className="year-game__progress-track">
                    <div
                      className="year-game__progress-fill"
                      style={{ width: `${playbackProgress}%` }}
                    />
                  </div>
                  <span>30s</span>
                </div>

                <audio
                  ref={audioRef}
                  src={question.song.audioUrl}
                  preload="auto"
                  onTimeUpdate={(event) => {
                    const audio = event.currentTarget
                    setPlaybackProgress(
                      audio.duration
                        ? (audio.currentTime / audio.duration) * 100
                        : 0,
                    )
                  }}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>
            </section>

            <section className="year-game__play-panel">
              <section className="year-game__answers">
                <div className="year-game__answers-header">
                  <div>
                    <p>WHEN WAS IT RELEASED?</p>
                    <span>THREE CHANCES. TRUST YOUR INSTINCT.</span>
                  </div>
                  <span>{attemptStatuses.length}/{MAX_ATTEMPTS} ATTEMPTS</span>
                </div>

                <div
  className="year-game__attempts"
  aria-label={`${attemptStatuses.length} of 3 attempts used`}
>
  {Array.from({ length: MAX_ATTEMPTS }, (_, index) => {
    const status = attemptStatuses[index]
    const guessedYear = guessedYears[index]

    return (
      <div
        key={index}
        className="year-game__attempt"
      >
        <span
          className={`year-game__attempt-slot${
            status
              ? ` year-game__attempt-slot--${status}`
              : ''
          }`}
        >
          {index + 1}
        </span>

        <span
          className={`year-game__attempt-year${
            status
              ? ` year-game__attempt-year--${status}`
              : ''
          }`}
        >
          {guessedYear || '—'}
        </span>
      </div>
    )
  })}
</div>

                {!hasAnswered ? (
                  <>
                    <form className="year-game__input-form" onSubmit={handleAnswer}>
                      <input
                        className="year-game__input"
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="Enter release year"
                        value={answerInput}
                        onChange={(event) => {
                          const value = event.target.value.replace(/\D/g, '')
                          setAnswerInput(value)
                        }}
                        aria-label="Enter release year"
                      />
                      <button
                        className="year-game__submit"
                        type="submit"
                        disabled={!/^\d{4}$/.test(answerInput.trim())}
                      >
                        SUBMIT
                      </button>
                    </form>

                    <p
                      className={`year-game__input-feedback${
                        attemptStatuses.length ? ' year-game__input-feedback--wrong' : ''
                      }`}
                      aria-live="polite"
                    >
                      {attemptStatuses.length
                        ? 'Not quite. Give it another shot!'
                        : 'Enter the year you think this song was released.'}
                    </p>
                  </>
                ) : (
                  <section className="year-game__reveal">
                    <div className="year-game__reveal-heading">
                      <span
                        className={
                          results[results.length - 1]?.correct
                            ? 'year-game__reveal-status year-game__reveal-status--correct'
                            : 'year-game__reveal-status year-game__reveal-status--wrong'
                        }
                      >
                        {results[results.length - 1]?.correct
                          ? 'CORRECT'
                          : 'OUT OF ATTEMPTS'}
                      </span>
                      <span className="year-game__reveal-label">RELEASE YEAR</span>
                    </div>

                    <div className="year-game__reveal-card">
                      <div className="year-game__reveal-art">
                        {question.song.artworkUrl ? (
                          <img
                            src={question.song.artworkUrl}
                            alt={`${question.song.album} album artwork`}
                          />
                        ) : (
                          <div className="year-game__reveal-art-placeholder">?</div>
                        )}
                      </div>

                      <div className="year-game__reveal-content">
                        <strong className="year-game__correct-year">
                          {question.song.releaseYear}
                        </strong>
                        <h2>{question.song.title}</h2>
                        <p>{question.song.artist} · {question.song.album}</p>
                        <p>{results[results.length - 1]?.points.toLocaleString()} POINTS</p>
                      </div>
                    </div>
                  </section>
                )}
              </section>

              {hasAnswered && (
                <button className="year-game__next" onClick={handleNext}>
                  <span>
                    {questionNumber >= TOTAL_QUESTIONS ? 'SEE RESULTS' : 'NEXT SONG'}
                  </span>
                  <ArrowRight size={17} />
                </button>
              )}
            </section>
          </main>
        )}
      </div>
    </div>
  )
}

type YearResultsScreenProps = {
  results: YearRecognitionResult[]
  score: number
  bestStreak: number
  onPlayAgain: () => void
  onBack: () => void
}

function YearResultsScreen({
  results,
  score,
  bestStreak,
  onPlayAgain,
  onBack,
}: YearResultsScreenProps) {
  const correctResults = results.filter((result) => result.correct)
  const recognizedCount = correctResults.length
  const accuracy = results.length
    ? Math.round((recognizedCount / results.length) * 100)
    : 0

  const firstTryCount = correctResults.filter((result) => result.attempts === 1).length
  const secondTryCount = correctResults.filter((result) => result.attempts === 2).length
  const thirdTryCount = correctResults.filter((result) => result.attempts === 3).length

  return (
    <div className="year-results">
      <div className="year-results__confetti">
        {Array.from({ length: 36 }, (_, index) => (
          <span
            key={index}
            className="year-results__confetti-piece"
            style={{ '--i': index } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="year-results__container">
        <header className="year-results__header">
          <div className="year-results__trophy"><Trophy size={25} /></div>
          <p className="year-results__eyebrow">ROUND COMPLETE</p>
          <h1>You know your music history.</h1>
          <p>
            You dated <strong>{recognizedCount}</strong> out of {results.length} songs correctly.
          </p>
        </header>

        <section className="year-results__score">
          <div>
            <span>FINAL SCORE</span>
            <strong>{score.toLocaleString()}</strong>
          </div>
          <div>
            <span>BEST STREAK</span>
            <strong>{bestStreak}</strong>
          </div>
        </section>

        <section className="year-results__score">
          <div>
            <span>YEARS GUESSED</span>
            <strong>{recognizedCount}<small>/{results.length}</small></strong>
          </div>
          <div>
            <span>ACCURACY</span>
            <strong>{accuracy}%</strong>
          </div>
        </section>

        <section className="year-results__speed">
          <div className="year-results__section-heading">
            <p>ATTEMPT BREAKDOWN</p>
            <span>HOW QUICKLY DID YOU KNOW?</span>
          </div>
          <div className="year-results__speed-grid">
            <div><span>FIRST TRY</span><strong>{firstTryCount}</strong></div>
            <div><span>SECOND TRY</span><strong>{secondTryCount}</strong></div>
            <div><span>THIRD TRY</span><strong>{thirdTryCount}</strong></div>
          </div>
        </section>

        <section className="year-results__breakdown">
          <div className="year-results__section-heading">
            <p>YOUR TIMELINE</p>
            <span>{results.length} SONGS</span>
          </div>

          <div className="year-results__list">
            {results.map((result) => (
              <div
                className={`year-results__item ${
                  result.correct
                    ? 'year-results__item--correct'
                    : 'year-results__item--missed'
                }`}
                key={result.questionNumber}
              >
                <span className="year-results__number">
                  {String(result.questionNumber).padStart(2, '0')}
                </span>

                <div className="year-results__art">
                  {result.artworkUrl ? <img src={result.artworkUrl} alt="" /> : <span>?</span>}
                </div>

                <div className="year-results__info">
                  <strong>{result.title}</strong>
                  <span>{result.artist} · {result.album}</span>
                </div>

                <div className="year-results__year">
                  <strong>{result.releaseYear}</strong>
                  <span className={result.correct ? 'year-results__time' : 'year-results__missed'}>
                    {result.correct
                      ? `${result.attempts} ${result.attempts === 1 ? 'ATTEMPT' : 'ATTEMPTS'} · +${result.points.toLocaleString()} ✓`
                      : 'THREE ATTEMPTS USED · 0 POINTS'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="year-results__actions">
          <button className="year-results__primary" onClick={onPlayAgain}>
            <RotateCcw size={17} /> PLAY AGAIN
          </button>
          <button className="year-results__secondary" onClick={onBack}>
            BACK TO PLAY
          </button>
        </div>
      </div>
    </div>
  )
}

export default YearGame
