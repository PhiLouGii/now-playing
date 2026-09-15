import {
  useEffect,
  useRef,
  useState,
} from 'react'

import AudioPlayer from '../../components/game/AudioPlayer'
import type { AudioPlayerHandle } from '../../components/game/AudioPlayer'
import AnswerGrid from '../../components/game/AnswerGrid'

import {
  generateQuestion,
} from '../../services/gameService'

import type { Question } from '../../types/game'

import './EndlessGame.css'

function EndlessGame() {
  const [question, setQuestion] =
    useState<Question | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null)

  const audioPlayerRef =
    useRef<AudioPlayerHandle | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadQuestion() {
      try {
        setIsLoading(true)
        setError(null)

        const generatedQuestion =
          await generateQuestion(
            'name-the-song',
            'medium',
          )

        console.log(
          'ENDLESS QUESTION:',
          generatedQuestion,
        )

        if (isMounted) {
          setQuestion(
            generatedQuestion,
          )
        }
      } catch (error) {
        console.error(
          'ENDLESS QUESTION ERROR:',
          error,
        )

        if (isMounted) {
          setError(
            'Failed to load question.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadQuestion()

    return () => {
      isMounted = false
    }
  }, [])

  function handleAnswer(
    answer: string,
  ) {
    if (!question) {
      return
    }

    setSelectedAnswer(answer)

    audioPlayerRef.current?.playPreview()

    console.log(
      'ENDLESS ANSWER:',
      answer,
      'CORRECT:',
      answer === question.correctAnswer,
    )
  }

  if (isLoading) {
    return (
      <main className="endless-game">
        <div className="endless-game__container">
          <p>LOADING ENDLESS MODE...</p>
        </div>
      </main>
    )
  }

  if (error || !question) {
    return (
      <main className="endless-game">
        <div className="endless-game__container">
          <p>
            {error ||
              'No question available.'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="endless-game">
      <div className="endless-game__container">

        <p className="endless-game__mode">
          ENDLESS MODE
        </p>

        <h1>
          NAME THAT SONG
        </h1>

        <div className="endless-game__artwork">
          {question.song.artworkUrl ? (
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
          ref={audioPlayerRef}
          key={question.id}
          audioUrl={
            question.song.audioUrl ?? ''
          }
          maxListenDuration={15}
          onTimeUpdate={() => {}}
          onStageComplete={() => {}}
          onPreviewComplete={() => {}}
          disabled={false}
        />

        <h2>
          What song is this?
        </h2>

        <AnswerGrid
          answers={question.answers}
          selectedAnswer={
            selectedAnswer
          }
          correctAnswer={
            question.correctAnswer
          }
          isAnswered={
            selectedAnswer !== null
          }
          onSelect={handleAnswer}
        />

      </div>
    </main>
  )
}

export default EndlessGame