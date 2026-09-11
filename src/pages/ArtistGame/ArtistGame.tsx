import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { Pause, Play, ArrowRight } from 'lucide-react'
import './ArtistGame.css'

type TestQuestion = {
  id: number
  title: string
  artist: string
  album: string
  artworkUrl: string
  audioUrl: string
  answers: string[]
  correctAnswer: string
}

const TEST_QUESTIONS: TestQuestion[] = [
  {
    id: 1,
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    album: 'Short n’ Sweet',
    artworkUrl:
      'https://e-cdns-images.dzcdn.net/images/cover/ab67616d0000b273/placeholder/500x500-000000-80-0-0.jpg',
    audioUrl:
      'https://cdnt-preview.dzcdn.net/api/1/1/placeholder.mp3',
    answers: [
      'Sabrina Carpenter',
      'Olivia Rodrigo',
      'Ariana Grande',
      'Chappell Roan',
    ],
    correctAnswer: 'Sabrina Carpenter',
  },
  {
    id: 2,
    title: 'Good Luck, Babe!',
    artist: 'Chappell Roan',
    album: 'The Rise and Fall of a Midwest Princess',
    artworkUrl:
      'https://e-cdns-images.dzcdn.net/images/cover/placeholder/500x500-000000-80-0-0.jpg',
    audioUrl:
      'https://cdnt-preview.dzcdn.net/api/1/1/placeholder.mp3',
    answers: [
      'Chappell Roan',
      'Sabrina Carpenter',
      'Billie Eilish',
      'Gracie Abrams',
    ],
    correctAnswer: 'Chappell Roan',
  },
]

const ROUND_LENGTH = 10

function ArtistGame() {
  const [questionIndex, setQuestionIndex] =
    useState(0)

  const [isPlaying, setIsPlaying] =
    useState(false)

  const [timeLeft, setTimeLeft] =
    useState(ROUND_LENGTH)

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null)

  const [isRevealed, setIsRevealed] =
    useState(false)

  const audioRef =
    useRef<HTMLAudioElement | null>(null)

  const question =
    TEST_QUESTIONS[questionIndex]

  /*
   * Reset the game whenever the question changes.
   */
  useEffect(() => {
    setTimeLeft(ROUND_LENGTH)
    setSelectedAnswer(null)
    setIsRevealed(false)
    setIsPlaying(false)

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [questionIndex])

  /*
   * Countdown timer.
   */
  useEffect(() => {
    if (!isPlaying || isRevealed) {
      return
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)

          setIsPlaying(false)
          setIsRevealed(true)

          if (audioRef.current) {
            audioRef.current.pause()
          }

          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [isPlaying, isRevealed])

  function handlePlayPause() {
    if (!audioRef.current || isRevealed) {
      return
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    audioRef.current.play()
      .then(() => {
        setIsPlaying(true)
      })
      .catch((error) => {
        console.error(
          'Could not play audio:',
          error,
        )
      })
  }

  function handleAnswer(answer: string) {
    if (isRevealed) {
      return
    }

    setSelectedAnswer(answer)
    setIsPlaying(false)
    setIsRevealed(true)

    if (audioRef.current) {
      audioRef.current.pause()
    }
  }

  function handleNextSong() {
    if (
      questionIndex <
      TEST_QUESTIONS.length - 1
    ) {
      setQuestionIndex(
        (current) => current + 1,
      )
    } else {
      // Temporary behaviour for testing.
      // We'll replace this with the real results screen.
      setQuestionIndex(0)
    }
  }

  const isCorrect =
    selectedAnswer ===
    question.correctAnswer

  const progress =
    ((ROUND_LENGTH - timeLeft) /
      ROUND_LENGTH) *
    100

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
              {questionIndex + 1}
              <small>/{TEST_QUESTIONS.length}</small>
            </strong>
          </div>
        </header>

        {/* QUESTION */}
        <section className="artist-game__question">
          <p className="artist-game__prompt">
            WHO IS THIS?
          </p>

          <h2>
            Can you recognize the artist?
          </h2>
        </section>

        {/* AUDIO PLAYER */}
        <section className="artist-game__audio">
          <audio
            ref={audioRef}
            src={question.audioUrl}
            preload="auto"
          />

          <div className="artist-game__audio-top">
            <span>
              {isRevealed
                ? 'LISTENING COMPLETE'
                : '10 SECOND SNIPPET'}
            </span>

            <strong
              className={
                timeLeft <= 3 &&
                !isRevealed
                  ? 'artist-game__timer artist-game__timer--urgent'
                  : 'artist-game__timer'
              }
            >
              {timeLeft}s
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
              : 'Choose an artist whenever you know it.'}
          </p>
        </section>

        {/* ANSWERS */}
        {!isRevealed && (
          <section className="artist-game__answers">
            <div className="artist-game__answers-header">
              <span>CHOOSE ONE</span>
              <span>4 OPTIONS</span>
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
                {selectedAnswer
                  ? isCorrect
                    ? 'CORRECT'
                    : 'NOT QUITE'
                  : "TIME'S UP"}
              </span>

              {selectedAnswer && (
                <strong>
                  {isCorrect
                    ? 'You got it.'
                    : `The artist was ${question.artist}.`}
                </strong>
              )}
            </div>

            <div className="artist-game__song-card">
              <img
                src={question.artworkUrl}
                alt={`${question.album} album cover`}
                className="artist-game__artwork"
              />

              <div className="artist-game__song-info">
                <p className="artist-game__song-label">
                  YOU WERE LISTENING TO
                </p>

                <h3>
                  {question.title}
                </h3>

                <p className="artist-game__artist">
                  {question.artist}
                </p>

                <p className="artist-game__album">
                  {question.album}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="artist-game__next"
              onClick={
                handleNextSong
              }
            >
              <span>
                NEXT SONG
              </span>

              <ArrowRight
                size={20}
              />
            </button>
          </section>
        )}
      </div>
    </div>
  )
}

export default ArtistGame