import { useCallback, useState } from 'react'
import AudioPlayer from '../../components/game/AudioPlayer'
import AnswerGrid from '../../components/game/AnswerGrid'
import GameHeader from '../../components/game/GameHeader'
import GameProgress from '../../components/game/GameProgress'
import { mockQuestions } from '../../data/mockSongs'
import {
  calculateFinalPoints,
  calculatePoints,
  calculateStreakMultiplier,
} from '../../lib/gameScoring'
import './Game.css'

function Game() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(10)
  const [answerTime, setAnswerTime] = useState<number | null>(null)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [multiplierEarned, setMultiplierEarned] = useState(1)
  const [isTimeUp, setIsTimeUp] = useState(false)

  const question = mockQuestions[currentQuestion]

  const isAnswered = selectedAnswer !== null || isTimeUp

  const handleTimeUpdate = useCallback(
    (time: number) => {
      if (!isAnswered) {
        setTimeRemaining(time)
      }
    },
    [isAnswered],
  )

  const handleTimeComplete = useCallback(() => {
    if (isAnswered) {
      return
    }

    setTimeRemaining(0)
    setAnswerTime(0)
    setPointsEarned(0)
    setMultiplierEarned(1)
    setIsTimeUp(true)
    setStreak(0)
  }, [isAnswered])

  const handleAnswer = (answer: string) => {
    if (isAnswered) {
      return
    }

    const timeAtAnswer = timeRemaining
    const isCorrect = answer === question.correctAnswer

    setSelectedAnswer(answer)
    setAnswerTime(timeAtAnswer)

    if (isCorrect) {
      const nextStreak = streak + 1
      const basePoints = calculatePoints(timeAtAnswer)
      const multiplier = calculateStreakMultiplier(nextStreak)
      const finalPoints = calculateFinalPoints(
        timeAtAnswer,
        nextStreak,
      )

      setPointsEarned(finalPoints)
      setMultiplierEarned(multiplier)

      setScore((currentScore) => currentScore + finalPoints)
      setStreak(nextStreak)

      console.log(
        `Base: ${basePoints} | Multiplier: x${multiplier} | Final: ${finalPoints}`,
      )
    } else {
      setPointsEarned(0)
      setMultiplierEarned(1)
      setStreak(0)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestion >= mockQuestions.length - 1) {
      return
    }

    setCurrentQuestion((current) => current + 1)
    setSelectedAnswer(null)
    setIsTimeUp(false)
    setAnswerTime(null)
    setPointsEarned(0)
    setMultiplierEarned(1)
    setTimeRemaining(10)
  }

  const isCorrect =
    selectedAnswer === question.correctAnswer

  return (
    <div className="game-page">
      <div className="game-page__container">
        <GameHeader
          currentQuestion={currentQuestion + 1}
          totalQuestions={mockQuestions.length}
          score={score}
        />

        <GameProgress
          current={currentQuestion + 1}
          total={mockQuestions.length}
        />

        <main className="game-content">
          <p className="game-content__category">
            NAME THAT SONG
          </p>

          <h1>What song is this?</h1>

          <div className="game-question">
            <div className="game-question__art">
              <span>?</span>
            </div>

            <AudioPlayer
              audioUrl={question.song.audioUrl}
              duration={10}
              onTimeUpdate={handleTimeUpdate}
              onComplete={handleTimeComplete}
            />
          </div>

          <AnswerGrid
            answers={question.answers}
            selectedAnswer={selectedAnswer}
            correctAnswer={question.correctAnswer}
            isAnswered={isAnswered}
            onSelect={handleAnswer}
          />

          {isAnswered && (
            <div
              className={`game-feedback ${
                isTimeUp
                  ? 'game-feedback--timeout'
                  : isCorrect
                    ? 'game-feedback--correct'
                    : 'game-feedback--incorrect'
              }`}
            >
              <div className="game-feedback__label">
                {isTimeUp
                  ? "TIME'S UP"
                  : isCorrect
                    ? 'CORRECT'
                    : 'INCORRECT'}
              </div>

              <div className="game-feedback__answer">
                {question.correctAnswer}
              </div>

              {isCorrect && !isTimeUp && (
                <div className="game-feedback__points">
                  +{pointsEarned.toLocaleString()} POINTS
                  {multiplierEarned > 1 && (
                    <span>
                      {' '}×{multiplierEarned}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="game-status">
            <div className="game-streak">
              <span>STREAK</span>
              <strong>{streak}</strong>
            </div>
          </div>

          {isAnswered && (
            <button
              type="button"
              className="game-next"
              onClick={handleNextQuestion}
              disabled={currentQuestion >= mockQuestions.length - 1}
            >
              {currentQuestion >= mockQuestions.length - 1
                ? 'GAME COMPLETE'
                : 'NEXT QUESTION'}
            </button>
          )}
        </main>
      </div>
    </div>
  )
}

export default Game