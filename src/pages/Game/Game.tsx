import { useState } from 'react'
import { mockQuestions } from '../../data/mockSongs'
import GameHeader from '../../components/game/GameHeader'
import AnswerGrid from '../../components/game/AnswerGrid'
import AudioPlayer from '../../components/game/AudioPlayer'
import './Game.css'

function Game() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)

  const question = mockQuestions[currentQuestion]

  const isAnswered = selectedAnswer !== null

  function handleAnswer(answer: string) {
    if (isAnswered) {
      return
    }

    setSelectedAnswer(answer)

    if (answer === question.correctAnswer) {
      setScore((currentScore) => currentScore + 100)
    }
  }

  function handleNextQuestion() {
    if (currentQuestion >= mockQuestions.length - 1) {
      return
    }

    setCurrentQuestion((current) => current + 1)
    setSelectedAnswer(null)
  }

  return (
    <div className="game-page">
      <div className="game-page__container">

        <GameHeader
          currentQuestion={currentQuestion + 1}
          totalQuestions={mockQuestions.length}
          score={score}
        />

        <main className="game-content">

          <p className="game-content__category">
            NAME THAT SONG
          </p>

          <h1>
            What song is this?
          </h1>

          <div className="game-question">
  <div className="game-question__art">
    <span>
      ?
    </span>
  </div>

  <AudioPlayer
    audioUrl={question.song.audioUrl}
    duration={10}
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