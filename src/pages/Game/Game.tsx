import {
  useEffect,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'

import AudioPlayer from '../../components/game/AudioPlayer'
import AnswerGrid from '../../components/game/AnswerGrid'
import GameHeader from '../../components/game/GameHeader'
import GameProgress from '../../components/game/GameProgress'
import ResultsScreen from '../../components/game/ResultsScreen'

import { defaultRound } from '../../data/defaultRound'
import {
  generateQuestion,
} from '../../services/gameService'

import type {
  Question,
  RoundConfig,
} from '../../types/game'

import {
  calculateFinalPoints,
  calculatePoints,
  calculateStreakMultiplier,
} from '../../lib/gameScoring'

import './Game.css'

const LISTENING_STAGES = [
  0.1,
  0.5,
  2,
  8,
  15,
]

function Game() {
  const location = useLocation()

  const roundConfig =
    (
      location.state as {
        roundConfig?: RoundConfig
      } | null
    )?.roundConfig ?? defaultRound

  const [questions, setQuestions] =
    useState<Question[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [isLoadingNext, setIsLoadingNext] =
    useState(false)

  const [currentQuestion, setCurrentQuestion] =
    useState(0)

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null)

  const [score, setScore] =
    useState(0)

  const [streak, setStreak] =
    useState(0)

  const [bestStreak, setBestStreak] =
    useState(0)

  const [correctAnswers, setCorrectAnswers] =
    useState(0)

  const [timeRemaining, setTimeRemaining] =
    useState(
      LISTENING_STAGES[0],
    )

  const [listeningStage, setListeningStage] =
    useState(0)

  const [pointsEarned, setPointsEarned] =
    useState(0)

  const [multiplierEarned, setMultiplierEarned] =
    useState(1)

  const [isGivingUp, setIsGivingUp] =
    useState(false)

  const [isGameComplete, setIsGameComplete] =
    useState(false)

  /*
   * Load the first question.
   */
  useEffect(() => {
    let isMounted = true

    async function loadFirstQuestion() {
      setIsLoading(true)

      try {
        const firstType =
          roundConfig.questionTypes[0]

        const question =
          await generateQuestion(
            firstType,
            roundConfig.difficulty,
          )

        if (isMounted) {
          setQuestions([question])
          setIsLoading(false)
        }
      } catch (error) {
        console.error(
          'Failed to generate first question:',
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
  }, [roundConfig])

  /*
   * Preload the next question while
   * the player is playing the current one.
   */
  useEffect(() => {
    if (
      questions.length === 0 ||
      questions.length >=
        roundConfig.questionCount
    ) {
      return
    }

    const nextIndex =
      questions.length

    let isMounted = true

    async function preloadNextQuestion() {
      try {
        const nextType =
          roundConfig.questionTypes[
            nextIndex %
              roundConfig.questionTypes.length
          ]

        const nextQuestion =
          await generateQuestion(
            nextType,
            roundConfig.difficulty,
          )

        if (isMounted) {
          setQuestions(
            (current) => {
              if (
                current.length >
                nextIndex
              ) {
                return current
              }

              return [
                ...current,
                nextQuestion,
              ]
            },
          )
        }
      } catch (error) {
        console.error(
          'Failed to preload next question:',
          error,
        )
      }
    }

    preloadNextQuestion()

    return () => {
      isMounted = false
    }
  }, [
    questions.length,
    roundConfig,
  ])

  /*
   * Loading state.
   */
  if (isLoading) {
    return (
      <div className="game-page">
        <div className="game-page__container">
          <main className="game-content">
            <p className="game-content__category">
              {roundConfig.name.toUpperCase()}
            </p>

            <h1>
              GETTING YOUR ROUND READY
            </h1>
          </main>
        </div>
      </div>
    )
  }

  /*
   * Failed to generate a question.
   */
  if (questions.length === 0) {
    return (
      <div className="game-page">
        <div className="game-page__container">
          <main className="game-content">
            <p className="game-content__category">
              {roundConfig.name.toUpperCase()}
            </p>

            <h1>
              NO QUESTIONS AVAILABLE
            </h1>

            <p>
              We couldn't generate a round
              right now.
            </p>
          </main>
        </div>
      </div>
    )
  }

  const question =
    questions[currentQuestion]

  /*
   * The song is revealed ONLY when:
   *
   * 1. The player answers correctly
   * 2. The player gives up
   */
  const isAnswered =
    selectedAnswer ===
      question.correctAnswer ||
    isGivingUp

  const maxListenDuration =
    LISTENING_STAGES[listeningStage]

  function handleTimeUpdate(
    time: number,
  ) {
    if (!isAnswered) {
      setTimeRemaining(time)
    }
  }

  /*
   * Called when the current listening
   * stage reaches its limit.
   *
   * This DOES NOT reveal the answer.
   */
  function handleStageComplete() {
    setTimeRemaining(0)
  }

  /*
   * Handle an answer.
   */
  function handleAnswer(
    answer: string,
  ) {
    if (isAnswered) {
      return
    }

    const isCorrect =
      answer === question.correctAnswer

    if (isCorrect) {
      const timeAtAnswer =
        maxListenDuration

      const nextStreak =
        streak + 1

      setSelectedAnswer(answer)

      setCorrectAnswers(
        (current) => current + 1,
      )

      setBestStreak(
        (current) =>
          Math.max(
            current,
            nextStreak,
          ),
      )

      const basePoints =
        calculatePoints(
          timeAtAnswer,
        )

      const multiplier =
        calculateStreakMultiplier(
          nextStreak,
        )

      const finalPoints =
        calculateFinalPoints(
          timeAtAnswer,
          nextStreak,
        )

      setPointsEarned(
        finalPoints,
      )

      setMultiplierEarned(
        multiplier,
      )

      setScore(
        (currentScore) =>
          currentScore +
          finalPoints,
      )

      setStreak(nextStreak)

      console.log(
        `Base: ${basePoints} | Multiplier: x${multiplier} | Final: ${finalPoints}`,
      )

      return
    }

    /*
     * Wrong answer:
     *
     * Do NOT reveal the song.
     * Do NOT end the question.
     *
     * Move to the next listening stage.
     */
    setSelectedAnswer(null)
    setStreak(0)
    setPointsEarned(0)
    setMultiplierEarned(1)

    if (
      listeningStage <
      LISTENING_STAGES.length - 1
    ) {
      setListeningStage(
        (current) => current + 1,
      )

      setTimeRemaining(
        LISTENING_STAGES[
          listeningStage + 1
        ],
      )
    }
  }

  /*
   * Player chooses to stop guessing.
   */
  function handleGiveUp() {
    if (isAnswered) {
      return
    }

    setIsGivingUp(true)
    setSelectedAnswer(null)
    setStreak(0)
    setPointsEarned(0)
    setMultiplierEarned(1)
  }

  /*
   * Reset all question-specific state.
   */
  function resetQuestionState() {
    setSelectedAnswer(null)
    setIsGivingUp(false)
    setListeningStage(0)
    setPointsEarned(0)
    setMultiplierEarned(1)
    setTimeRemaining(
      LISTENING_STAGES[0],
    )
  }

  /*
   * Move to the next question.
   */
  async function handleNextQuestion() {
    if (
      currentQuestion >=
      roundConfig.questionCount - 1
    ) {
      setIsGameComplete(true)
      return
    }

    const nextIndex =
      currentQuestion + 1

    /*
     * If the next question was already
     * preloaded, use it immediately.
     */
    if (questions[nextIndex]) {
      setCurrentQuestion(nextIndex)
      resetQuestionState()
      return
    }

    /*
     * Fallback if preloading hasn't
     * finished yet.
     */
    setIsLoadingNext(true)

    try {
      const nextType =
        roundConfig.questionTypes[
          nextIndex %
            roundConfig.questionTypes.length
        ]

      const nextQuestion =
        await generateQuestion(
          nextType,
          roundConfig.difficulty,
        )

      setQuestions(
        (current) => {
          if (
            current[nextIndex]
          ) {
            return current
          }

          return [
            ...current,
            nextQuestion,
          ]
        },
      )

      setCurrentQuestion(nextIndex)
      resetQuestionState()
    } catch (error) {
      console.error(
        'Failed to generate next question:',
        error,
      )
    } finally {
      setIsLoadingNext(false)
    }
  }

  /*
   * Results screen.
   */
  if (isGameComplete) {
    return (
      <ResultsScreen
        score={score}
        totalQuestions={
          roundConfig.questionCount
        }
        correctAnswers={
          correctAnswers
        }
        bestStreak={bestStreak}
      />
    )
  }

  const isCorrect =
    selectedAnswer ===
    question.correctAnswer

  return (
    <div className="game-page">
      <div className="game-page__container">
        <GameHeader
          currentQuestion={
            currentQuestion + 1
          }
          totalQuestions={
            roundConfig.questionCount
          }
          score={score}
        />

        <GameProgress
          current={
            currentQuestion + 1
          }
          total={
            roundConfig.questionCount
          }
        />

        <main className="game-content">
          <p className="game-content__category">
            {question.type ===
              'name-the-song' &&
              'NAME THAT SONG'}

            {question.type ===
              'name-the-artist' &&
              'NAME THAT ARTIST'}

            {question.type ===
              'name-the-album' &&
              'NAME THAT ALBUM'}

            {question.type ===
              'guess-the-year' &&
              'GUESS THE YEAR'}
          </p>

          <h1>
            {question.type ===
              'name-the-song' &&
              'What song is this?'}

            {question.type ===
              'name-the-artist' &&
              'Who performs this song?'}

            {question.type ===
              'name-the-album' &&
              'Which album is this from?'}

            {question.type ===
              'guess-the-year' &&
              'When was this song released?'}
          </h1>

          <div className="game-question">
            <div
              className={`game-question__art ${
                isAnswered
                  ? 'game-question__art--revealed'
                  : ''
              }`}
            >
              {isAnswered &&
              question.song.artworkUrl ? (
                <img
                  src={
                    question.song.artworkUrl
                  }
                  alt={`${question.song.album} album artwork`}
                />
              ) : (
                <span>?</span>
              )}
            </div>

            <AudioPlayer
              key={question.id}
              audioUrl={
                question.song.audioUrl
              }
              maxListenDuration={
                maxListenDuration
              }
              onTimeUpdate={
                handleTimeUpdate
              }
              onStageComplete={
                handleStageComplete
              }
              disabled={isAnswered}
            />

            <div className="game-listening-stage">
              <span>
                LISTENING STAGE
              </span>

              <strong>
                {listeningStage + 1}
              </strong>

              <span>
                / {LISTENING_STAGES.length}
              </span>
            </div>

            {isAnswered && (
              <div className="game-song-reveal">
                <p className="game-song-reveal__title">
                  {question.song.title}
                </p>

                <p className="game-song-reveal__artist">
                  {question.song.artist}
                </p>

                <p className="game-song-reveal__album">
                  {question.song.album}
                </p>

                {question.type ===
                  'guess-the-year' &&
                  question.song.releaseYear !==
                    undefined && (
                    <p className="game-song-reveal__year">
                      {
                        question.song
                          .releaseYear
                      }
                    </p>
                  )}
              </div>
            )}
          </div>

          <AnswerGrid
            answers={
              question.answers
            }
            selectedAnswer={
              selectedAnswer
            }
            correctAnswer={
              question.correctAnswer
            }
            isAnswered={
              isAnswered
            }
            onSelect={
              handleAnswer
            }
          />

          {!isAnswered && (
            <button
              type="button"
              className="game-give-up"
              onClick={
                handleGiveUp
              }
            >
              GIVE UP
            </button>
          )}

          {isAnswered && (
            <div
              className={`game-feedback ${
                isGivingUp
                  ? 'game-feedback--timeout'
                  : isCorrect
                    ? 'game-feedback--correct'
                    : 'game-feedback--incorrect'
              }`}
            >
              <div className="game-feedback__label">
                {isGivingUp
                  ? 'ANSWER REVEALED'
                  : isCorrect
                    ? 'CORRECT'
                    : 'INCORRECT'}
              </div>

              <div className="game-feedback__answer">
                {
                  question.correctAnswer
                }
              </div>

              {isCorrect &&
                !isGivingUp && (
                  <div className="game-feedback__points">
                    +
                    {pointsEarned.toLocaleString()}{' '}
                    POINTS

                    {multiplierEarned >
                      1 && (
                      <span>
                        {' '}×
                        {
                          multiplierEarned
                        }
                      </span>
                    )}
                  </div>
                )}
            </div>
          )}

          <div className="game-status">
            <div className="game-streak">
              <span>
                STREAK
              </span>

              <strong>
                {streak}
              </strong>
            </div>

            <div className="game-listening-time">
              <span>
                LISTEN TIME
              </span>

              <strong>
                {timeRemaining < 1
                  ? `${timeRemaining.toFixed(1)}s`
                  : `${Math.ceil(
                      timeRemaining,
                    )}s`}
              </strong>
            </div>
          </div>

          {isAnswered && (
            <button
              type="button"
              className="game-next"
              onClick={
                handleNextQuestion
              }
              disabled={
                isLoadingNext
              }
            >
              {isLoadingNext
                ? 'LOADING...'
                : currentQuestion >=
                    roundConfig.questionCount -
                      1
                  ? 'SEE RESULTS'
                  : 'NEXT QUESTION'}
            </button>
          )}
        </main>
      </div>
    </div>
  )
}

export default Game
