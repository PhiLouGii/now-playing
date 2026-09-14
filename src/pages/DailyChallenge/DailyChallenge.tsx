import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import type {
  Question,
  QuestionType,
} from '../../types/game'

import {
  getDailyChallenge,
} from '../../services/dailyChallengeService'

import {
  calculateDailyPoints,
} from '../../services/game/dailyScoringService'

import AudioPlayer from '../../components/game/AudioPlayer'

import './DailyChallenge.css'

const LISTENING_STAGES = [
  0.1,
  0.5,
  2,
  8,
  15,
]

type QuestionResult = {
  questionId: string
  questionType: QuestionType
  songTitle: string
  artist: string
  album: string
  releaseYear?: number
  artworkUrl: string
  selectedAnswer: string | null
  correctAnswer: string
  isCorrect: boolean
  revealed: boolean
  listenDuration: number
  points: number
}

function getQuestionPrompt(
  type: QuestionType,
) {
  switch (type) {
    case 'name-the-song':
      return {
        eyebrow: 'NAME THE SONG',
        question: 'What song is this?',
      }

    case 'name-the-artist':
      return {
        eyebrow: 'NAME THE ARTIST',
        question: 'Who performs this song?',
      }

    case 'name-the-album':
      return {
        eyebrow: 'NAME THE ALBUM',
        question:
          'Which album is this song from?',
      }

    case 'guess-the-year':
      return {
        eyebrow: 'GUESS THE YEAR',
        question:
          'What year was this song released?',
      }

    default:
      return {
        eyebrow: 'NAME THE SONG',
        question: 'What song is this?',
      }
  }
}

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

  const [bestStreak, setBestStreak] =
    useState(0)

  const [score, setScore] =
    useState(0)

  const [correctAnswers, setCorrectAnswers] =
    useState(0)

  const [questionResults, setQuestionResults] =
    useState<QuestionResult[]>([])

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
          <div className="daily-game__loading-spinner" />

          <p>LOADING TODAY'S CHALLENGE</p>
        </div>
      </main>
    )
  }

  if (!challenge) {
    return (
      <main className="daily-game">
        <div className="daily-game__error-state">
          <p>COULDN'T LOAD TODAY'S CHALLENGE.</p>

          <button
            type="button"
            onClick={() => navigate('/')}
          >
            BACK HOME
          </button>
        </div>
      </main>
    )
  }

  const currentChallenge = challenge

const question: Question =
  currentChallenge.questions[currentQuestion]

  const prompt =
    getQuestionPrompt(question.type)

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

    const listenDuration =
      LISTENING_STAGES[listeningStage]

    audioPlayerRef.current?.playPreview()

    let points = 0

    if (correct) {
      const nextStreak =
        streak + 1

      const result =
        calculateDailyPoints(
          listenDuration,
          nextStreak,
          currentChallenge.twist.type,
        )

      points = result.finalPoints

      setStreak(nextStreak)

      setBestStreak(
        (current) =>
          Math.max(
            current,
            nextStreak,
          ),
      )

      setScore(
        (current) =>
          current + points,
      )

      setCorrectAnswers(
        (current) =>
          current + 1,
      )
    } else {
      setStreak(0)
    }

    setSelectedAnswer(answer)

    setAnswerStatus(
      correct
        ? 'correct'
        : 'incorrect',
    )

    setQuestionResults(
      (current) => [
        ...current,
        {
          questionId: question.id,
          questionType: question.type,
          songTitle: question.song.title,
          artist: question.song.artist,
          album: question.song.album,
          releaseYear:
            question.song.releaseYear,
          artworkUrl:
            question.song.artworkUrl,
          selectedAnswer: answer,
          correctAnswer:
            question.correctAnswer,
          isCorrect: correct,
          revealed: false,
          listenDuration,
          points,
        },
      ],
    )
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

    setQuestionResults(
      (current) => [
        ...current,
        {
          questionId: question.id,
          questionType: question.type,
          songTitle: question.song.title,
          artist: question.song.artist,
          album: question.song.album,
          releaseYear:
            question.song.releaseYear,
          artworkUrl:
            question.song.artworkUrl,
          selectedAnswer: null,
          correctAnswer:
            question.correctAnswer,
          isCorrect: false,
          revealed: true,
          listenDuration:
            LISTENING_STAGES[
              listeningStage
            ],
          points: 0,
        },
      ],
    )
  }

  function handleNext() {
    const isLastQuestion =
      currentQuestion >=
      currentChallenge.questions.length - 1

    if (isLastQuestion) {
      navigate(
        '/daily-challenge/results',
        {
          state: {
            challenge,
            score,
            correctAnswers,
            bestStreak,
            questionResults,
          },
        },
      )

      return
    }

    setCurrentQuestion(
      (current) =>
        current + 1,
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
            <p className="daily-game__eyebrow">
              DAILY CHALLENGE
            </p>

            <h1 className="daily-game__title">
              {challenge.theme.name}
            </h1>

            <p className="daily-game__description">
              {challenge.theme.description}
            </p>
          </div>

          <div className="daily-game__progress">
            <span>
              {currentQuestion + 1}
            </span>

            <span>
              / {challenge.questionCount}
            </span>
          </div>
        </header>

        <div className="daily-game__twist">
          <span className="daily-game__twist-icon">
            ⚡
          </span>

          <div>
            <p>DAILY TWIST</p>

            <strong>
              {challenge.twist.name}
            </strong>

            <span>
              {challenge.twist.description}
            </span>
          </div>
        </div>

        <section className="daily-game__player-card">

          <div className="daily-game__timer">
            <span>
              LISTENING WINDOW
            </span>

            <strong>
              {timeRemaining}s
            </strong>
          </div>

          <div className="daily-game__wave">
            {Array.from({
              length: 28,
            }).map((_, index) => (
              <span
                key={index}
                className={
                  index <
                  (listeningStage + 1) * 5
                    ? 'daily-game__wave-bar daily-game__wave-bar--active'
                    : 'daily-game__wave-bar'
                }
              />
            ))}
          </div>

          <AudioPlayer
            ref={audioPlayerRef}
            key={question.id}
            audioUrl={
              question.song.audioUrl ?? ''
            }
            maxListenDuration={
              LISTENING_STAGES[
                listeningStage
              ]
            }
            onTimeUpdate={
              setTimeRemaining
            }
            onStageComplete={() => {
              setTimeRemaining(0)
            }}
          />

          <div className="daily-game__player-bottom">
            <span>
              {answerStatus === 'idle'
                ? 'LISTEN AND IDENTIFY'
                : 'ANSWER LOCKED'}
            </span>

            <div className="daily-game__progress-track">
              <div
                className="daily-game__progress-fill"
                style={{
                  width: `${
                    ((listeningStage + 1) /
                      LISTENING_STAGES.length) *
                    100
                  }%`,
                }}
              />
            </div>

            <span>
              STAGE {listeningStage + 1}/
              {LISTENING_STAGES.length}
            </span>
          </div>
        </section>

        <section className="daily-game__question">
          <p>
            {prompt.eyebrow}
          </p>

          <h2>
            {isAnswered
              ? question.correctAnswer
              : prompt.question}
          </h2>

          {isAnswered && (
            <span>
              {question.song.title}
              {' · '}
              {question.song.artist}
            </span>
          )}
        </section>

        <section className="daily-game__answers">
          <div className="daily-game__answers-header">
            <p>SELECT YOUR ANSWER</p>

            <span>
              {question.answers.length} OPTIONS
            </span>
          </div>

          <div className="daily-game__answer-grid">
            {question.answers.map(
              (answer, index) => {
                const isSelected =
                  selectedAnswer === answer

                const isCorrect =
                  answer ===
                  question.correctAnswer

                return (
                  <button
                    key={answer}
                    type="button"
                    disabled={isAnswered}
                    onClick={() =>
                      handleAnswer(answer)
                    }
                    className={`daily-game__answer ${
                      isAnswered
                        ? isCorrect
                          ? 'daily-game__answer--correct'
                          : isSelected
                            ? 'daily-game__answer--wrong'
                            : 'daily-game__answer--disabled'
                        : ''
                    }`}
                  >
                    <span className="daily-game__answer-number">
                      {String(
                        index + 1,
                      ).padStart(2, '0')}
                    </span>

                    <span className="daily-game__answer-text">
                      {answer}
                    </span>

                    <span className="daily-game__answer-arrow">
                      →
                    </span>
                  </button>
                )
              },
            )}
          </div>
        </section>

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
              className="daily-game__advance"
            >
              ADVANCE
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={
                handleRevealAnswer
              }
              className="daily-game__reveal-button"
            >
              REVEAL ANSWER
            </button>
          </div>
        )}

        {isAnswered && (
          <div className="daily-game__after">
            <div className="daily-game__result">
              <span
                className={
                  answerStatus === 'correct'
                    ? 'daily-game__result-icon daily-game__result-icon--correct'
                    : 'daily-game__result-icon daily-game__result-icon--wrong'
                }
              >
                {answerStatus === 'correct'
                  ? '✓'
                  : answerStatus === 'revealed'
                    ? '!'
                    : '×'}
              </span>

              <div>
                <p>
                  {answerStatus ===
                  'correct'
                    ? 'CORRECT'
                    : answerStatus ===
                        'revealed'
                      ? 'ANSWER REVEALED'
                      : 'NOT QUITE'}
                </p>

                <span>
                  {answerStatus ===
                  'correct'
                    ? `+${questionResults.at(-1)?.points ?? 0} POINTS`
                    : question.correctAnswer}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={
                handleNext
              }
              className="daily-game__next"
            >
              {currentQuestion >=
              challenge.questions.length - 1
                ? 'SEE RESULTS'
                : 'NEXT SONG'}
              <span>→</span>
            </button>
          </div>
        )}

        <footer className="daily-game__stats">
          <div>
            <span>STREAK</span>
            <strong>
              {streak}
            </strong>
          </div>

          <div>
            <span>SCORE</span>
            <strong>
              {score.toLocaleString()}
            </strong>
          </div>

          <div>
            <span>ACCURACY</span>
            <strong>
              {currentQuestion === 0
                ? correctAnswers > 0
                  ? '100%'
                  : '0%'
                : `${Math.round(
                    (correctAnswers /
                      (currentQuestion + 1)) *
                      100,
                  )}%`}
            </strong>
          </div>
        </footer>

      </div>
    </main>
  )
}

export default DailyChallenge
