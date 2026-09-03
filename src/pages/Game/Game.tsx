import { useCallback, useState } from 'react'
import AudioPlayer from '../../components/game/AudioPlayer'
import AnswerGrid from '../../components/game/AnswerGrid'
import GameHeader from '../../components/game/GameHeader'
import GameProgress from '../../components/game/GameProgress'
import { mockQuestions } from '../../data/mockSongs'
import { calculatePoints } from '../../lib/gameScoring'
import './Game.css'

function Game() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(10)
  const [answerTime, setAnswerTime] = useState<number | null>(null)

  const question = mockQuestions[currentQuestion]

  const isAnswered = selectedAnswer !== null

  const handleTimeUpdate = useCallback(
    (time: number) => {
      if (!isAnswered) {
        setTimeRemaining(time)
      }
    },
    [isAnswered],
  )

  const handleAnswer = (answer: string) => {
    if (isAnswered) {
      return
    }

    const timeAtAnswer = timeRemaining

    setSelectedAnswer(answer)
    setAnswerTime(timeAtAnswer)

    const isCorrect = answer === question.correctAnswer

    if (isCorrect) {
      const points = calculatePoints(timeAtAnswer)

      setScore((currentScore) => currentScore + points)
      setStreak((currentStreak) => currentStreak + 1)
    } else {
      setStreak(0)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestion >= mockQuestions.length - 1) {
      return
    }

    setCurrentQuestion((current) => current + 1)
    setSelectedAnswer(null)
    setAnswerTime(null)
    setTimeRemaining(10)
  }

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
            />
          </div>

          <AnswerGrid
            answers={question.answers}
            selectedAnswer={selectedAnswer}
            correctAnswer={question.correctAnswer}
            isAnswered={isAnswered}
            onSelect={handleAnswer}
          />

          <div className="game-status">
            <div className="game-streak">
              <span>STREAK</span>
              <strong>{streak}</strong>
            </div>

            {isAnswered && (
              <div className="game-result">
                {selectedAnswer === question.correctAnswer
                  ? `CORRECT +${calculatePoints(answerTime ?? 0)}`
                  : 'INCORRECT'}
              </div>
            )}
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