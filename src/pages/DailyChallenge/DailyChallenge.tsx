import {
  useEffect,
  useRef,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'

import type {
  Question,
} from '../../types/game'

import {
  getDailyChallenge,
} from '../../services/dailyChallengeService'

import {
  calculateDailyPoints,
} from '../../services/game/dailyScoringService'

import AudioPlayer from '../../components/game/AudioPlayer'

import AnswerGrid from '../../components/game/AnswerGrid'

import './DailyChallenge.css'

const LISTENING_STAGES = [
  0.1,
  0.5,
  2,
  8,
  15,
]

function DailyChallenge() {
  const navigate = useNavigate()

  const audioPlayerRef =
    useRef<{
      playPreview: () => Promise<void>
    } | null>(null)

  const [challenge, setChallenge] =
    useState<
      Awaited<
        ReturnType<typeof getDailyChallenge>
      > | null
    >(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [currentQuestion, setCurrentQuestion] =
    useState(0)

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null)

  const [answerStatus, setAnswerStatus] =
    useState<
      'idle' |
      'correct' |
      'incorrect' |
      'revealed'
    >('idle')

  const [listeningStage, setListeningStage] =
    useState(0)

  const [timeRemaining, setTimeRemaining] =
    useState(LISTENING_STAGES[0])

  const [streak, setStreak] =
    useState(0)

  const [score, setScore] =
    useState(0)

  const [correctAnswers, setCorrectAnswers] =
    useState(0)

  useEffect(() => {
    async function loadChallenge() {
      try {
        const data =
          await getDailyChallenge()

        setChallenge(data)
      } catch (error) {
        console.error(
          'Failed to load daily challenge:',
          error,
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadChallenge()
  }, [])

  if (isLoading) {
    return (
      <main className="daily-game">
        <div className="daily-game__loading">
          LOADING TODAY'S CHALLENGE...
        </div>
      </main>
    )
  }

  if (!challenge) {
    return (
      <main className="daily-game">
        <div className="daily-game__error">
          <p>
            TODAY'S CHALLENGE COULDN'T LOAD.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate('/')
            }
          >
            BACK HOME
          </button>
        </div>
      </main>
    )
  }

  const question: Question =
    challenge.questions[currentQuestion]

  const isAnswered =
    answerStatus !== 'idle'

  function handleAnswer(
    answer: string,
  ) {
    if (isAnswered) {
      return
    }

    const correct =
      answer === question.correctAnswer

    audioPlayerRef.current?.playPreview()

    setSelectedAnswer(answer)
    setAnswerStatus(
      correct
        ? 'correct'
        : 'incorrect',
    )

    if (correct) {
      const nextStreak =
        streak + 1

      const result =
        calculateDailyPoints(
          LISTENING_STAGES[
            listeningStage
          ],
          nextStreak,
          challenge.twist.type,
        )

      setStreak(nextStreak)
      setScore(
        (current) =>
          current +
          result.finalPoints,
      )

      setCorrectAnswers(
        (current) =>
          current + 1,
      )
    } else {
      setStreak(0)
    }
  }

  function handleAdvance() {
    if (isAnswered) {
      return
    }

    if (
      listeningStage >=
      LISTENING_STAGES.length - 1
    ) {
      return
    }

    const nextStage =
      listeningStage + 1

    setListeningStage(nextStage)

    setTimeRemaining(
      LISTENING_STAGES[nextStage],
    )
  }

  function handleRevealAnswer() {
    if (isAnswered) {
      return
    }

    audioPlayerRef.current?.playPreview()

    setAnswerStatus('revealed')
    setSelectedAnswer(
      question.correctAnswer,
    )
    setStreak(0)
  }

  function handleNext() {
    if (
      currentQuestion >=
      challenge.questions.length - 1
    ) {
      navigate(
        '/daily-challenge/results',
        {
          state: {
            challenge,
            score,
            correctAnswers,
            streak,
          },
        },
      )

      return
    }

    setCurrentQuestion(
      (current) => current + 1,
    )

    setSelectedAnswer(null)
    setAnswerStatus('idle')
    setListeningStage(0)
    setTimeRemaining(
      LISTENING_STAGES[0],
    )
  }

  return (
    <main className="daily-game">
      <div className="daily-game__container">

        <header className="daily-game__header">
          <div>
            <p className="label">
              DAILY CHALLENGE
            </p>

            <h1>
              {challenge.theme.name}
            </h1>

            <p>
              {challenge.theme.description}
            </p>
          </div>

          <div className="daily-game__twist">
            <span>⚡</span>

            <div>
              <small>TWIST</small>
              <strong>
                {challenge.twist.name}
              </strong>
            </div>
          </div>
        </header>

        <div className="daily-game__progress">
          SONG {currentQuestion + 1}
          {' / '}
          {challenge.questionCount}
        </div>

        <section className="daily-game__song">
          <div className="daily-game__artwork">
            {isAnswered ? (
              <img
                src={question.song.artworkUrl}
                alt=""
              />
            ) : (
              <div>
                ?
              </div>
            )}
          </div>

          <p className="daily-game__prompt">
            NAME THAT SONG
          </p>

          <h2>
            {isAnswered
              ? question.song.title
              : 'What song is this?'}
          </h2>

          {isAnswered && (
            <p className="daily-game__artist">
              {question.song.artist}
            </p>
          )}
        </section>

        <AudioPlayer
          ref={audioPlayerRef}
          key={question.id}
          audioUrl={
            question.song.audioUrl ?? ''
          }
          duration={
            LISTENING_STAGES[
              listeningStage
            ]
          }
          onTimeUpdate={
            setTimeRemaining
          }
        />

        <AnswerGrid
          answers={question.answers}
          correctAnswer={
            question.correctAnswer
          }
          selectedAnswer={
            selectedAnswer
          }
          answerStatus={
            answerStatus
          }
          onAnswer={
            handleAnswer
          }
        />

        {!isAnswered && (
          <div className="daily-game__actions">
            <button
              type="button"
              onClick={
                handleAdvance
              }
              disabled={
                listeningStage >=
                LISTENING_STAGES.length - 1
              }
            >
              ADVANCE →
            </button>

            <button
              type="button"
              onClick={
                handleRevealAnswer
              }
            >
              REVEAL ANSWER
            </button>
          </div>
        )}

        {isAnswered && (
          <div className="daily-game__after">
            <div>
              {answerStatus ===
                'correct'
                ? '✓ CORRECT'
                : answerStatus ===
                    'revealed'
                  ? 'ANSWER REVEALED'
                  : '✕ INCORRECT'}
            </div>

            <button
              type="button"
              onClick={
                handleNext
              }
            >
              {currentQuestion >=
              challenge.questions.length - 1
                ? 'SEE RESULTS'
                : 'NEXT SONG →'}
            </button>
          </div>
        )}

        <div className="daily-game__stats">
          <span>
            🔥 STREAK {streak}
          </span>

          <span>
            SCORE {score.toLocaleString()}
          </span>

          <span>
            {timeRemaining}s
          </span>
        </div>

      </div>
    </main>
  )
}

export default DailyChallenge