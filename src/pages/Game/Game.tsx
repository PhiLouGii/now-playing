import { useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AudioPlayer from '../../components/game/AudioPlayer'
import AnswerGrid from '../../components/game/AnswerGrid'
import GameHeader from '../../components/game/GameHeader'
import GameProgress from '../../components/game/GameProgress'
import ResultsScreen from '../../components/game/ResultsScreen'
import type { RoundConfig } from '../../types/game'
import { defaultRound } from '../../data/defaultRound'
import { songs } from '../../data/songs'
import { generateQuestion } from '../../lib/questionGenerator'
import {
  calculateFinalPoints,
  calculatePoints,
  calculateStreakMultiplier,
} from '../../lib/gameScoring'
import './Game.css'

function Game() {
  const location = useLocation()

  const roundConfig =
    (location.state as { roundConfig?: RoundConfig } | null)
      ?.roundConfig ?? defaultRound

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)

  const [timeRemaining, setTimeRemaining] = useState(10)
  const [answerTime, setAnswerTime] = useState<number | null>(null)

  const [pointsEarned, setPointsEarned] = useState(0)
  const [multiplierEarned, setMultiplierEarned] = useState(1)

  const [isTimeUp, setIsTimeUp] = useState(false)
  const [isGameComplete, setIsGameComplete] = useState(false)

  const [questions] = useState(() => {
    const shuffledSongs = [...songs].sort(
      () => Math.random() - 0.5,
    )

    return shuffledSongs
      .slice(
        0,
        Math.min(
          roundConfig.questionCount,
          songs.length,
        ),
      )
      .map((song, index) =>
        generateQuestion(
          song,
          songs,
          {
            type:
              roundConfig.questionTypes[
                index % roundConfig.questionTypes.length
              ],
            difficulty: roundConfig.difficulty,
          },
        ),
      )
  })

  const question = questions[currentQuestion]

  const isAnswered =
    selectedAnswer !== null || isTimeUp

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
    const isCorrect =
      answer === question.correctAnswer

    setSelectedAnswer(answer)
    setAnswerTime(timeAtAnswer)

    if (isCorrect) {
      const nextStreak = streak + 1

      setCorrectAnswers(
        (current) => current + 1,
      )

      setBestStreak(
        (current) =>
          Math.max(current, nextStreak),
      )

      const basePoints =
        calculatePoints(timeAtAnswer)

      const multiplier =
        calculateStreakMultiplier(nextStreak)

      const finalPoints =
        calculateFinalPoints(
          timeAtAnswer,
          nextStreak,
        )

      setPointsEarned(finalPoints)
      setMultiplierEarned(multiplier)

      setScore(
        (currentScore) =>
          currentScore + finalPoints,
      )

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
    if (
      currentQuestion >=
      questions.length - 1
    ) {
      setIsGameComplete(true)
      return
    }

    setCurrentQuestion(
      (current) => current + 1,
    )

    setSelectedAnswer(null)
    setIsTimeUp(false)
    setAnswerTime(null)
    setPointsEarned(0)
    setMultiplierEarned(1)
    setTimeRemaining(10)
  }

  const isCorrect =
    selectedAnswer === question.correctAnswer

  if (isGameComplete) {
    return (
      <ResultsScreen
        score={score}
        totalQuestions={questions.length}
        correctAnswers={correctAnswers}
        bestStreak={bestStreak}
      />
    )
  }

  return (
    <div className="game-page">
      <div className="game-page__container">
        <GameHeader
          currentQuestion={
            currentQuestion + 1
          }
          totalQuestions={questions.length}
          score={score}
        />

        <GameProgress
          current={currentQuestion + 1}
          total={questions.length}
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
            <div className="game-question__art">
              <span>?</span>
            </div>

            <AudioPlayer
              key={question.id}
              audioUrl={question.song.audioUrl}
              duration={10}
              onTimeUpdate={
                handleTimeUpdate
              }
              onComplete={
                handleTimeComplete
              }
            />
          </div>

          <AnswerGrid
            answers={question.answers}
            selectedAnswer={selectedAnswer}
            correctAnswer={
              question.correctAnswer
            }
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

              {isCorrect &&
                !isTimeUp && (
                  <div className="game-feedback__points">
                    +
                    {pointsEarned.toLocaleString()}
                    {' '}POINTS

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
              <span>STREAK</span>
              <strong>{streak}</strong>
            </div>
          </div>

          {isAnswered && (
            <button
              type="button"
              className="game-next"
              onClick={
                handleNextQuestion
              }
            >
              {currentQuestion >=
              questions.length - 1
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