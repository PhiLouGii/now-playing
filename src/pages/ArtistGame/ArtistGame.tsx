import {
  useCallback,
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
  Search,
  Trophy,
  X,
  LoaderCircle,
} from 'lucide-react'

import { useNavigate } from 'react-router-dom'

import LoadingScreen from '../../components/loading/LoadingScreen'

import {
  generateQuestion,
  getLoadingFacts,
  searchArtists,
  type ArtistSuggestion,
  type LoadingFact,
} from '../../services/gameService'

import { submitScore } from '../../services/scoreService'

import { calculateFinalPoints } from '../../lib/gameScoring'

import type { Question } from '../../types/game'

import './ArtistGame.css'

const ROUND_LENGTH = 10
const TOTAL_QUESTIONS = 10
const SEARCH_DEBOUNCE_MS = 300
const MAX_SUGGESTIONS = 8

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
  submittedAnswer?: string
}

function normalizeAnswer(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase()
}

function ArtistGame() {
  const navigate = useNavigate()

  /* =====================================================
     QUESTIONS
  ===================================================== */

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)

  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingNext, setIsLoadingNext] = useState(false)

  /* =====================================================
     LOADING FACTS
  ===================================================== */

  const [loadingFacts, setLoadingFacts] = useState<LoadingFact[]>([])
  const [loadingComplete, setLoadingComplete] = useState(false)

  /* =====================================================
     ANSWER INPUT
  ===================================================== */

  const [artistInput, setArtistInput] = useState('')
  const [suggestions, setSuggestions] = useState<ArtistSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSuggestionListOpen, setIsSuggestionListOpen] = useState(false)
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>('idle')

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const searchSequenceRef = useRef(0)

  /* =====================================================
     TIMER / AUDIO
  ===================================================== */

  const [timeRemaining, setTimeRemaining] = useState(ROUND_LENGTH)
  const [isPlaying, setIsPlaying] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  /* =====================================================
     SCORE
  ===================================================== */

  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)

  /* =====================================================
     RESULTS
  ===================================================== */

  const [recognitionResults, setRecognitionResults] = useState<
    ArtistRecognitionResult[]
  >([])

  const [isGameComplete, setIsGameComplete] = useState(false)

  const scoreSubmitted = useRef(false)

  /* =====================================================
     INITIAL QUESTION
  ===================================================== */

  useEffect(() => {
    let isMounted = true

    async function loadFirstQuestion() {
      setIsLoading(true)
      setLoadingComplete(false)

      getLoadingFacts()
        .then((data) => {
          if (isMounted) {
            setLoadingFacts(data)
          }
        })
        .catch((error) => {
          console.error('Failed to load loading facts:', error)
        })

      try {
        const firstQuestion = await generateQuestion(
          'name-the-artist',
          'medium',
        )

        if (!isMounted) return

        setQuestions([firstQuestion])
        setLoadingComplete(true)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to generate artist question:', error)

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

  /* =====================================================
     PRELOAD QUESTIONS
  ===================================================== */

  useEffect(() => {
    if (
      questions.length === 0 ||
      questions.length >= TOTAL_QUESTIONS
    ) {
      return
    }

    let isMounted = true
    const nextIndex = questions.length

    async function preloadNextQuestion() {
      try {
        const nextQuestion = await generateQuestion(
          'name-the-artist',
          'medium',
        )

        if (!isMounted) return

        setQuestions((current) => {
          if (current.length > nextIndex) {
            return current
          }

          return [...current, nextQuestion]
        })
      } catch (error) {
        console.error('Failed to preload artist question:', error)
      }
    }

    preloadNextQuestion()

    return () => {
      isMounted = false
    }
  }, [questions.length])

  /* =====================================================
     CURRENT QUESTION
  ===================================================== */

  const question = questions[currentQuestion]

  /* =====================================================
     ARTIST SEARCH
  ===================================================== */

  useEffect(() => {
    const query = artistInput.trim()
    const requestSequence = ++searchSequenceRef.current

    if (
      query.length < 2 ||
      answerStatus !== 'idle'
    ) {
      setSuggestions([])
      setIsSearching(false)
      setIsSuggestionListOpen(false)
      setHighlightedSuggestion(-1)
      return
    }

    setIsSearching(true)

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await searchArtists(query)

        if (requestSequence !== searchSequenceRef.current) {
          return
        }

        setSuggestions(results.slice(0, MAX_SUGGESTIONS))
        setIsSuggestionListOpen(true)
        setHighlightedSuggestion(-1)
      } catch (error) {
        if (requestSequence !== searchSequenceRef.current) {
          return
        }

        console.error('Artist search failed:', error)
        setSuggestions([])
        setIsSuggestionListOpen(true)
      } finally {
        if (requestSequence === searchSequenceRef.current) {
          setIsSearching(false)
        }
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [artistInput, answerStatus])

  /* =====================================================
     INVALIDATE OLD SEARCHES
  ===================================================== */

  const clearArtistSearch = useCallback(() => {
    searchSequenceRef.current += 1

    setArtistInput('')
    setSuggestions([])
    setIsSearching(false)
    setIsSuggestionListOpen(false)
    setHighlightedSuggestion(-1)
  }, [])

  /* =====================================================
     RESET QUESTION
  ===================================================== */

  useEffect(() => {
    setTimeRemaining(ROUND_LENGTH)
    setSelectedAnswer(null)
    setAnswerStatus('idle')
    setIsPlaying(false)

    clearArtistSearch()

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [currentQuestion, clearArtistSearch])

  /* =====================================================
     COUNTDOWN
  ===================================================== */

  useEffect(() => {
    if (
      !isPlaying ||
      answerStatus !== 'idle' ||
      !question
    ) {
      return
    }

    const timer = window.setInterval(() => {
      setTimeRemaining((current) => {
        if (current <= 0.1) {
          window.clearInterval(timer)

          setIsPlaying(false)
          setAnswerStatus('timeout')
          setStreak(0)
          clearArtistSearch()

          setRecognitionResults((currentResults) => [
            ...currentResults,
            {
              questionNumber: currentQuestion + 1,
              title: question.song.title,
              artist: question.song.artist,
              album: question.song.album,
              artworkUrl: question.song.artworkUrl ?? '',
              recognitionTime: ROUND_LENGTH,
              correct: false,
              points: 0,
            },
          ])

          if (audioRef.current) {
            audioRef.current.pause()
          }

          return 0
        }

        return Math.max(0, current - 0.1)
      })
    }, 100)

    return () => {
      window.clearInterval(timer)
    }
  }, [
    isPlaying,
    answerStatus,
    currentQuestion,
    question,
    clearArtistSearch,
  ])

  /* =====================================================
     PLAY / PAUSE
  ===================================================== */

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
      console.error('Could not play audio:', error)
    }
  }

  /* =====================================================
     SUBMIT ANSWER
  ===================================================== */

  function handleAnswer(answer: string) {
    if (
      answerStatus !== 'idle' ||
      !question ||
      !answer.trim()
    ) {
      return
    }

    const isCorrect =
      normalizeAnswer(answer) ===
      normalizeAnswer(question.correctAnswer)

    const recognitionTime = Math.min(
      ROUND_LENGTH,
      Math.max(0, ROUND_LENGTH - timeRemaining),
    )

    const nextStreak = isCorrect ? streak + 1 : 0

    const earnedPoints = isCorrect
      ? calculateFinalPoints(recognitionTime, nextStreak)
      : 0

    setSelectedAnswer(answer.trim())
    setAnswerStatus(isCorrect ? 'correct' : 'incorrect')
    setIsPlaying(false)

    clearArtistSearch()

    setStreak(nextStreak)

    if (isCorrect) {
      setBestStreak((currentBest) =>
        Math.max(currentBest, nextStreak),
      )
    }

    setScore((currentScore) => currentScore + earnedPoints)

    if (audioRef.current) {
      audioRef.current.pause()
    }

    setRecognitionResults((currentResults) => [
      ...currentResults,
      {
        questionNumber: currentQuestion + 1,
        title: question.song.title,
        artist: question.song.artist,
        album: question.song.album,
        artworkUrl: question.song.artworkUrl ?? '',
        recognitionTime,
        correct: isCorrect,
        points: earnedPoints,
        submittedAnswer: answer.trim(),
      },
    ])
  }

  /* =====================================================
     SELECT ARTIST SUGGESTION
  ===================================================== */

  function handleSelectSuggestion(artist: ArtistSuggestion) {
    setArtistInput(artist.name)
    setIsSuggestionListOpen(false)
    setHighlightedSuggestion(-1)
    handleAnswer(artist.name)
  }

  /* =====================================================
     INPUT KEYBOARD CONTROLS
  ===================================================== */

  function handleInputKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (answerStatus !== 'idle') return

    if (
      event.key === 'ArrowDown' &&
      suggestions.length > 0
    ) {
      event.preventDefault()
      setIsSuggestionListOpen(true)

      setHighlightedSuggestion((current) =>
        current >= suggestions.length - 1
          ? 0
          : current + 1,
      )

      return
    }

    if (
      event.key === 'ArrowUp' &&
      suggestions.length > 0
    ) {
      event.preventDefault()

      setHighlightedSuggestion((current) =>
        current <= 0
          ? suggestions.length - 1
          : current - 1,
      )

      return
    }

    if (event.key === 'Escape') {
      setIsSuggestionListOpen(false)
      setHighlightedSuggestion(-1)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()

      if (
        isSuggestionListOpen &&
        highlightedSuggestion >= 0 &&
        suggestions[highlightedSuggestion]
      ) {
        handleSelectSuggestion(
          suggestions[highlightedSuggestion],
        )
        return
      }

      handleAnswer(artistInput)
    }
  }

  /* =====================================================
     AUDIO ENDED
  ===================================================== */

  function handleAudioEnded() {
    setIsPlaying(false)
  }

  /* =====================================================
     NEXT SONG
  ===================================================== */

  async function handleNextSong() {
    if (currentQuestion >= TOTAL_QUESTIONS - 1) {
      if (audioRef.current) {
        audioRef.current.pause()
      }

      setIsGameComplete(true)
      return
    }

    const nextIndex = currentQuestion + 1

    if (questions[nextIndex]) {
      setCurrentQuestion(nextIndex)
      return
    }

    setIsLoadingNext(true)

    try {
      const nextQuestion = await generateQuestion(
        'name-the-artist',
        'medium',
      )

      setQuestions((current) => {
        if (current[nextIndex]) {
          return current
        }

        return [...current, nextQuestion]
      })

      setCurrentQuestion(nextIndex)
    } catch (error) {
      console.error('Failed to generate next artist question:', error)
    } finally {
      setIsLoadingNext(false)
    }
  }

  /* =====================================================
     SAVE SCORE
  ===================================================== */

  useEffect(() => {
    if (
      !isGameComplete ||
      scoreSubmitted.current ||
      recognitionResults.length < TOTAL_QUESTIONS
    ) {
      return
    }

    scoreSubmitted.current = true

    const correctAnswers = recognitionResults.filter(
      (result) => result.correct,
    ).length

    const accuracy =
      (correctAnswers / TOTAL_QUESTIONS) * 100

    const totalListeningTime = recognitionResults.reduce(
      (total, result) => total + result.recognitionTime,
      0,
    )

    async function saveScore() {
      try {
        await submitScore({
          gameMode: 'name-the-artist',
          score,
          accuracy,
          bestStreak,
          questions: TOTAL_QUESTIONS,
          correctAnswers,
          totalListeningTime,
        })

        console.log('ARTIST GAME SCORE SAVED')
      } catch (error) {
        console.error('FAILED TO SAVE ARTIST GAME SCORE:', error)
      }
    }

    saveScore()
  }, [
    isGameComplete,
    recognitionResults,
    score,
    bestStreak,
  ])

  /* =====================================================
     LOADING
  ===================================================== */

  if (isLoading) {
    return (
      <LoadingScreen
        facts={loadingFacts}
        message="Loading Name the Artist..."
        isComplete={loadingComplete}
      />
    )
  }

  /* =====================================================
     NO QUESTION
  ===================================================== */

  if (!question && !isGameComplete) {
    return (
      <div className="artist-game">
        <div className="artist-game__container">
          <main className="artist-game__loading">
            <p className="artist-game__eyebrow">
              GUESS THE ARTIST
            </p>

            <h1>NO SONG AVAILABLE</h1>

            <p>
              We couldn't generate a song right now.
            </p>
          </main>
        </div>
      </div>
    )
  }

  /* =====================================================
     RESULTS
  ===================================================== */

  if (isGameComplete) {
    return (
      <ArtistResultsScreen
        results={recognitionResults}
        score={score}
        bestStreak={bestStreak}
        onPlayAgain={() => window.location.reload()}
        onBackToPlay={() => navigate('/play')}
      />
    )
  }

  const progress =
    ((ROUND_LENGTH - timeRemaining) / ROUND_LENGTH) * 100

  const isRevealed = answerStatus !== 'idle'
  const isCorrect = answerStatus === 'correct'

  /* =====================================================
     GAME UI
  ===================================================== */

  return (
    <div className="artist-game">
      <div className="artist-game__container">
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
            <span>ROUND</span>

            <strong>
              {currentQuestion + 1}
              <small>/{TOTAL_QUESTIONS}</small>
            </strong>
          </div>
        </header>

        <main className="artist-game__board">
          <section className="artist-game__question">
            {!isRevealed ? (
              <>
                <div className="artist-game__artwork-placeholder">
                  <span>♪</span>
                </div>

                <p className="artist-game__prompt">
                  WHO IS THIS?
                </p>

                <h2>
                  Listen closely. Who performs this song?
                </h2>
              </>
            ) : (
              <>
                {question.song.artworkUrl ? (
                  <img
                    src={question.song.artworkUrl}
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

                <h2>{question.song.title}</h2>
              </>
            )}

            <section className="artist-game__audio">
              <audio
                ref={audioRef}
                key={question.id}
                src={question.song.audioUrl}
                preload="auto"
                onEnded={handleAudioEnded}
              />

              <div className="artist-game__audio-top">
                <span>10 SECOND SNIPPET</span>

                <strong
                  className={
                    timeRemaining <= 3 && !isRevealed
                      ? 'artist-game__timer artist-game__timer--urgent'
                      : 'artist-game__timer'
                  }
                >
                  {timeRemaining.toFixed(1)}s
                </strong>
              </div>

              <div className="artist-game__player">
                <button
                  type="button"
                  className="artist-game__play"
                  onClick={handlePlayPause}
                  disabled={isRevealed}
                  aria-label={isPlaying ? 'Pause song' : 'Play song'}
                >
                  {isPlaying ? (
                    <Pause size={21} strokeWidth={2} />
                  ) : (
                    <Play size={21} strokeWidth={2} />
                  )}
                </button>

                <div className="artist-game__wave">
                  {Array.from({ length: 32 }).map((_, index) => (
                    <span
                      key={index}
                      className={
                        isPlaying
                          ? 'artist-game__wave-bar artist-game__wave-bar--playing'
                          : 'artist-game__wave-bar'
                      }
                      style={{
                        height: `${20 + ((index * 17) % 45)}%`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="artist-game__progress">
                <div
                  className="artist-game__progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="artist-game__hint">
                {isRevealed
                  ? 'The answer has been revealed.'
                  : 'You have 10 seconds. Trust your ears.'}
              </p>
            </section>
          </section>

          <section className="artist-game__play-panel">
            {!isRevealed ? (
              <section className="artist-game__answers">
                <div className="artist-game__answers-header">
                  <span>NAME THE ARTIST</span>
                  <span>TYPE YOUR ANSWER</span>
                </div>

                <form
                  className="artist-game__artist-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleAnswer(artistInput)
                  }}
                >
                  <div className="artist-game__search-wrap">
                    <Search
                      className="artist-game__search-icon"
                      size={19}
                    />

                    <input
                      ref={searchInputRef}
                      type="text"
                      className="artist-game__artist-input"
                      value={artistInput}
                      onChange={(event) => {
                        setArtistInput(event.target.value)
                        setIsSuggestionListOpen(true)
                      }}
                      onKeyDown={handleInputKeyDown}
                      onFocus={() => {
                        if (suggestions.length > 0) {
                          setIsSuggestionListOpen(true)
                        }
                      }}
                      onBlur={() => {
                        window.setTimeout(() => {
                          setIsSuggestionListOpen(false)
                        }, 150)
                      }}
                      placeholder="Start typing an artist..."
                      autoComplete="off"
                      disabled={isRevealed}
                      aria-label="Enter artist name"
                      aria-autocomplete="list"
                      aria-expanded={isSuggestionListOpen}
                      aria-controls="artist-suggestions"
                    />

                    {isSearching && (
                      <LoaderCircle
                        className="artist-game__search-loading"
                        size={18}
                      />
                    )}
                  </div>

                  {isSuggestionListOpen && (
                    <div
                      id="artist-suggestions"
                      className="artist-game__suggestions"
                      role="listbox"
                    >
                      {suggestions.map((artist, index) => (
                        <button
                          key={artist.id}
                          type="button"
                          role="option"
                          aria-selected={highlightedSuggestion === index}
                          className={
                            highlightedSuggestion === index
                              ? 'artist-game__suggestion artist-game__suggestion--active'
                              : 'artist-game__suggestion'
                          }
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelectSuggestion(artist)}
                        >
                          {artist.image ? (
                            <img
                              src={artist.image}
                              alt=""
                              className="artist-game__suggestion-image"
                            />
                          ) : (
                            <span className="artist-game__suggestion-image artist-game__suggestion-image--empty">
                              ♪
                            </span>
                          )}

                          <span className="artist-game__suggestion-name">
                            {artist.name}
                          </span>

                          <ArrowRight size={15} />
                        </button>
                      ))}

                      {!isSearching &&
                        artistInput.trim().length >= 2 &&
                        suggestions.length === 0 && (
                          <p className="artist-game__suggestions-empty">
                            No matching artists found. You can still submit your answer.
                          </p>
                        )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="artist-game__submit"
                    disabled={!artistInput.trim() || isRevealed}
                  >
                    <span>LOCK IN ANSWER</span>
                    <ArrowRight size={17} />
                  </button>
                </form>

                <p className="artist-game__input-hint">
                  Choose a suggestion or enter the artist's name yourself.
                  Press Enter to submit.
                </p>
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
                    {answerStatus === 'timeout'
                      ? "TIME'S UP"
                      : isCorrect
                        ? 'CORRECT'
                        : 'NOT QUITE'}
                  </span>

                  <strong>
                    {answerStatus === 'timeout'
                      ? `The artist was ${question.correctAnswer}.`
                      : isCorrect
                        ? 'You got it.'
                        : `The artist was ${question.correctAnswer}.`}
                  </strong>

                  {selectedAnswer && !isCorrect && (
                    <small>
                      Your answer: {selectedAnswer}
                    </small>
                  )}
                </div>

                <div className="artist-game__song-card">
                  {question.song.artworkUrl ? (
                    <img
                      src={question.song.artworkUrl}
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

                    <h3>{question.song.title}</h3>

                    <p className="artist-game__artist">
                      {question.song.artist}
                    </p>

                    <p className="artist-game__album">
                      {question.song.album}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="artist-game__next"
                  onClick={handleNextSong}
                  disabled={isLoadingNext}
                >
                  <span>
                    {isLoadingNext
                      ? 'LOADING...'
                      : currentQuestion >= TOTAL_QUESTIONS - 1
                        ? 'SEE RESULTS'
                        : 'NEXT SONG'}
                  </span>

                  {!isLoadingNext && <ArrowRight size={17} />}
                </button>
              </section>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

/* =====================================================
   RESULTS SCREEN
===================================================== */

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
  const correctResults = results.filter(
    (result) => result.correct,
  )

  const recognizedCount = correctResults.length

  const accuracy =
    results.length > 0
      ? Math.round((recognizedCount / results.length) * 100)
      : 0

  const recognitionTimes = correctResults.map(
    (result) => result.recognitionTime,
  )

  const averageTime =
    recognitionTimes.length > 0
      ? recognitionTimes.reduce((total, time) => total + time, 0) /
        recognitionTimes.length
      : 0

  const fastestTime =
    recognitionTimes.length > 0
      ? Math.min(...recognitionTimes)
      : 0

  const fastestResult = correctResults.find(
    (result) => result.recognitionTime === fastestTime,
  )

  const confettiPieces = Array.from({ length: 36 })

  return (
    <div className="artist-results">
      <div
        className="artist-results__confetti"
        aria-hidden="true"
      >
        {confettiPieces.map((_, index) => (
          <span
            key={index}
            className="artist-results__confetti-piece"
            style={{
              left: `${(index * 29) % 100}%`,
              animationDelay: `${(index % 12) * 0.08}s`,
              animationDuration: `${2.4 + (index % 5) * 0.35}s`,
              transform: `rotate(${index * 37}deg)`,
            }}
          />
        ))}
      </div>

      <div className="artist-results__container">
        <header className="artist-results__header">
          <div className="artist-results__trophy">
            <Trophy size={23} strokeWidth={1.8} />
          </div>

          <p className="artist-results__eyebrow">
            ROUND COMPLETE
          </p>

          <h1>You know your music.</h1>

          <p>
            Ten songs. How many artists did you recognise?
          </p>
        </header>

        <section className="artist-results__hero">
          <div className="artist-results__hero-main">
            <span>FINAL SCORE</span>

            <strong>{score}</strong>
          </div>

          <div className="artist-results__hero-stats">
            <div>
              <span>ARTISTS RECOGNISED</span>

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
          </div>
        </section>

        <section className="artist-results__speed">
          <div className="artist-results__section-heading">
            <p>RECOGNITION SPEED</p>
            <h2>How fast did you know?</h2>
          </div>

          <div className="artist-results__speed-grid">
            <div className="artist-results__speed-stat">
              <span>AVERAGE RECOGNITION</span>

              <strong>
                {averageTime > 0
                  ? `${averageTime.toFixed(1)}s`
                  : '—'}
              </strong>
            </div>

            <div className="artist-results__speed-stat artist-results__speed-stat--fastest">
              <span>FASTEST RECOGNITION</span>

              <strong>
                {fastestTime > 0
                  ? `${fastestTime.toFixed(1)}s`
                  : '—'}
              </strong>

              {fastestResult && (
                <small>{fastestResult.artist}</small>
              )}
            </div>
          </div>
        </section>

        <section className="artist-results__breakdown">
          <div className="artist-results__section-heading">
            <p>ROUND RECAP</p>
            <h2>Your artists</h2>
          </div>

          <div className="artist-results__list">
            {results.map((result) => (
              <div
                key={`${result.questionNumber}-${result.title}`}
                className={
                  result.correct
                    ? 'artist-results__item artist-results__item--correct'
                    : 'artist-results__item artist-results__item--missed'
                }
              >
                <div className="artist-results__number">
                  {String(result.questionNumber).padStart(2, '0')}
                </div>

                <div className="artist-results__artwork-wrapper">
                  {result.artworkUrl ? (
                    <img
                      src={result.artworkUrl}
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
                  <strong>{result.artist}</strong>
                  <span>{result.title}</span>
                </div>

                <div className="artist-results__result-meta">
                  {result.correct ? (
                    <>
                      <span className="artist-results__time">
                        +{result.points} · {result.recognitionTime.toFixed(1)}s
                      </span>

                      <Check size={16} strokeWidth={2.5} />
                    </>
                  ) : (
                    <>
                      <span className="artist-results__missed-label">
                        MISSED
                      </span>

                      <X size={16} strokeWidth={2.5} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="artist-results__actions">
          <button
            type="button"
            className="artist-results__play-again"
            onClick={onPlayAgain}
          >
            <RotateCcw size={16} />
            <span>PLAY AGAIN</span>
          </button>

          <button
            type="button"
            className="artist-results__back"
            onClick={onBackToPlay}
          >
            BACK TO PLAY
          </button>
        </div>
      </div>
    </div>
  )
}

export default ArtistGame
