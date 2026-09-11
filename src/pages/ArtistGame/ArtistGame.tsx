import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { ArrowRight, Pause, Play } from 'lucide-react'

import { generateQuestion } from '../../services/gameService'

import type { Question } from '../../types/game'

import './ArtistGame.css'

const ROUND_LENGTH = 10
const TOTAL_QUESTIONS = 10

type AnswerStatus =
  | 'idle'
  | 'correct'
  | 'incorrect'
  | 'timeout'

function ArtistGame() {
  /*
   * --------------------------------------------------
   * QUESTION STATE
   * --------------------------------------------------
   */

  const [questions, setQuestions] =
    useState<Question[]>([])

  const [currentQuestion, setCurrentQuestion] =
    useState(0)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isLoadingNext, setIsLoadingNext] =
    useState(false)

  /*
   * --------------------------------------------------
   * ANSWER STATE
   * --------------------------------------------------
   */

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null)

  const [answerStatus, setAnswerStatus] =
    useState<AnswerStatus>('idle')

  /*
   * --------------------------------------------------
   * TIMER STATE
   * --------------------------------------------------
   */

  const [timeRemaining, setTimeRemaining] =
    useState(ROUND_LENGTH)

  const [isPlaying, setIsPlaying] =
    useState(false)

  /*
   * --------------------------------------------------
   * GAME STATE
   * --------------------------------------------------
   */

  const [isGameComplete, setIsGameComplete] =
    useState(false)

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
    let isMounted = true

    async function loadFirstQuestion() {
      setIsLoading(true)

      try {
        const firstQuestion =
          await generateQuestion(
            'name-the-artist',
            'medium',
          )

        if (!isMounted) {
          return
        }

        setQuestions([firstQuestion])
        setIsLoading(false)
      } catch (error) {
        console.error(
          'Failed to generate artist question:',
          error,
        )

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

  /*
   * --------------------------------------------------
   * PRELOAD NEXT QUESTION
   * --------------------------------------------------
   */

  useEffect(() => {
    if (
      questions.length === 0 ||
      questions.length >= TOTAL_QUESTIONS
    ) {
      return
    }

    const nextIndex = questions.length

    let isMounted = true

    async function preloadNextQuestion() {
      try {
        const nextQuestion =
          await generateQuestion(
            'name-the-artist',
            'medium',
          )

        if (!isMounted) {
          return
        }

        setQuestions((current) => {
          if (current.length > nextIndex) {
            return current
          }

          return [
            ...current,
            nextQuestion,
          ]
        })
      } catch (error) {
        console.error(
          'Failed to preload artist question:',
          error,
        )
      }
    }

    preloadNextQuestion()

    return () => {
      isMounted = false
    }
  }, [questions.length])

  /*
   * --------------------------------------------------
   * CURRENT QUESTION
   * --------------------------------------------------
   */

  const question =
    questions[currentQuestion]

  /*
   * --------------------------------------------------
   * RESET WHEN QUESTION CHANGES
   * --------------------------------------------------
   */

  useEffect(() => {
    setTimeRemaining(ROUND_LENGTH)
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
      answerStatus !== 'idle'
    ) {
      return
    }

    const timer =
      window.setInterval(() => {
        setTimeRemaining((current) => {
          if (current <= 0.1) {
            window.clearInterval(timer)

            finishTimeLimit()

            return 0
          }

          return Math.max(
            0,
            current - 0.1,
          )
        })
      }, 100)

    return () => {
      window.clearInterval(timer)
    }
  }, [
    isPlaying,
    answerStatus,
  ])

  /*
   * --------------------------------------------------
   * TIME LIMIT
   * --------------------------------------------------
   */

  function finishTimeLimit() {
    setIsPlaying(false)
    setAnswerStatus('timeout')

    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

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
    if (answerStatus !== 'idle') {
      return
    }

    const isCorrect =
      answer === question.correctAnswer

    setSelectedAnswer(answer)
    setAnswerStatus(
      isCorrect
        ? 'correct'
        : 'incorrect',
    )

    setIsPlaying(false)

    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

  /*
   * --------------------------------------------------
   * AUDIO ENDED
   * --------------------------------------------------
   *
   * Deezer previews can be shorter than the full
   * 10-second window. If the audio ends naturally,
   * stop playback but don't reveal the answer yet.
   *
   * The player can be restarted while time remains.
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
      setIsGameComplete(true)
      return
    }

    const nextIndex =
      currentQuestion + 1

    if (questions[nextIndex]) {
      setCurrentQuestion(nextIndex)
      return
    }

    setIsLoadingNext(true)

    try {
      const nextQuestion =
        await generateQuestion(
          'name-the-artist',
          'medium',
        )

      setQuestions((current) => {
        if (current[nextIndex]) {
          return current
        }

        return [
          ...current,
          nextQuestion,
        ]
      })

      setCurrentQuestion(nextIndex)
    } catch (error) {
      console.error(
        'Failed to generate next artist question:',
        error,
      )
    } finally {
      setIsLoadingNext(false)
    }
  }

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (isLoading) {
    return (
      <div className="artist-game">
        <div className="artist-game__container">
          <main className="artist-game__loading">
            <p className="artist-game__eyebrow">
              QUICK MODE
            </p>

            <h1>
              GETTING YOUR SONG READY
            </h1>

            <p>
              Finding something you might
              recognize...
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

  if (!question) {
    return (
      <div className="artist-game">
        <div className="artist-game__container">
          <main className="artist-game__loading">
            <p className="artist-game__eyebrow">
              GUESS THE ARTIST
            </p>

            <h1>
              NO SONG AVAILABLE
            </h1>

            <p>
              We couldn't generate a song
              right now.
            </p>
          </main>
        </div>
      </div>
    )
  }

  /*
   * --------------------------------------------------
   * GAME COMPLETE
   * --------------------------------------------------
   *
   * Temporary until we build a dedicated Artist
   * Game results screen.
   */

  if (isGameComplete) {
    return (
      <div className="artist-game">
        <div className="artist-game__container">
          <main className="artist-game__loading">
            <p className="artist-game__eyebrow">
              ROUND COMPLETE
            </p>

            <h1>
              NICE WORK.
            </h1>

            <p>
              You've completed Guess the Artist.
            </p>
          </main>
        </div>
      </div>
    )
  }

  const progress =
    ((ROUND_LENGTH - timeRemaining) /
      ROUND_LENGTH) *
    100

  const isRevealed =
    answerStatus !== 'idle'

  const isCorrect =
    answerStatus === 'correct'

  return (
    <div className="artist-game">
      <div className="artist-game__container">

        {/* HEADER */}

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
              <small>
                /{TOTAL_QUESTIONS}
              </small>
            </strong>
          </div>
        </header>

        {/* QUESTION */}

        <section className="artist-game__question">
          <p className="artist-game__prompt">
            WHO IS THIS?
          </p>

          <h2>
            Who performs this song?
          </h2>
        </section>

        {/* AUDIO */}

        <section className="artist-game__audio">

          <audio
            ref={audioRef}
            key={question.id}
            src={question.song.audioUrl}
            preload="auto"
            onEnded={
              handleAudioEnded
            }
          />

          <div className="artist-game__audio-top">
            <span>
              10 SECOND SNIPPET
            </span>

            <strong
              className={
                timeRemaining <= 3 &&
                !isRevealed
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
              onClick={
                handlePlayPause
              }
              disabled={isRevealed}
              aria-label={
                isPlaying
                  ? 'Pause song'
                  : 'Play song'
              }
            >
              {isPlaying ? (
                <Pause
                  size={28}
                  strokeWidth={2}
                />
              ) : (
                <Play
                  size={28}
                  strokeWidth={2}
                />
              )}
            </button>

            <div className="artist-game__wave">
              {Array.from({
                length: 32,
              }).map((_, index) => (
                <span
                  key={index}
                  className={
                    isPlaying
                      ? 'artist-game__wave-bar artist-game__wave-bar--playing'
                      : 'artist-game__wave-bar'
                  }
                  style={{
                    height: `${
                      20 +
                      ((index * 17) %
                        45)
                    }%`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="artist-game__progress">
            <div
              className="artist-game__progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <p className="artist-game__hint">
            {isRevealed
              ? 'The answer has been revealed.'
              : 'Pick an artist as soon as you know it.'}
          </p>
        </section>

        {/* ANSWERS */}

        {!isRevealed && (
          <section className="artist-game__answers">

            <div className="artist-game__answers-header">
              <span>
                CHOOSE ONE
              </span>

              <span>
                4 OPTIONS
              </span>
            </div>

            <div className="artist-game__answer-grid">
              {question.answers.map(
                (answer, index) => (
                  <button
                    key={answer}
                    type="button"
                    className="artist-game__answer"
                    onClick={() =>
                      handleAnswer(
                        answer,
                      )
                    }
                  >
                    <span className="artist-game__answer-number">
                      {String(
                        index + 1,
                      ).padStart(2, '0')}
                    </span>

                    <span>
                      {answer}
                    </span>
                  </button>
                ),
              )}
            </div>
          </section>
        )}

        {/* REVEAL */}

        {isRevealed && (
          <section className="artist-game__reveal">

            <div
              className={
                isCorrect
                  ? 'artist-game__result artist-game__result--correct'
                  : 'artist-game__result artist-game__result--incorrect'
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
                  ? `The artist was ${question.correctAnswer}.`
                  : isCorrect
                    ? 'You got it.'
                    : `The artist was ${question.correctAnswer}.`}
              </strong>
            </div>

            <div className="artist-game__song-card">

              {question.song.artworkUrl && (
                <img
                  src={
                    question.song.artworkUrl
                  }
                  alt={`${question.song.album} album cover`}
                  className="artist-game__artwork"
                />
              )}

              <div className="artist-game__song-info">
                <p className="artist-game__song-label">
                  YOU WERE LISTENING TO
                </p>

                <h3>
                  {question.song.title}
                </h3>

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
              onClick={
                handleNextSong
              }
              disabled={isLoadingNext}
            >
              <span>
                {isLoadingNext
                  ? 'LOADING...'
                  : currentQuestion >=
                      TOTAL_QUESTIONS - 1
                    ? 'SEE RESULTS'
                    : 'NEXT SONG'}
              </span>

              {!isLoadingNext && (
                <ArrowRight
                  size={20}
                />
              )}
            </button>

          </section>
        )}

      </div>
    </div>
  )
}

export default ArtistGame