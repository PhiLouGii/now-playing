import {
  useEffect,
  useRef,
  useState,
} from 'react'

import AudioPlayer, {
  type AudioPlayerHandle,
} from '../../components/game/AudioPlayer'

import AnswerGrid from '../../components/game/AnswerGrid'

import {
  generateQuestion,
} from '../../services/gameService'

import type {
  Question,
} from '../../types/game'

import './EndlessGame.css'

const LISTENING_STAGES = [
  0.1,
  0.5,
  2,
  8,
  15,
]

const QUESTION_TYPES = [
  'name-the-song',
  'name-the-artist',
  'name-the-album',
  'guess-the-year',
] as const

type AnswerStatus =
  | 'idle'
  | 'correct'
  | 'incorrect'
  | 'revealed'

function getQuestionLabel(
  type: Question['type'],
) {
  switch (type) {
    case 'name-the-song':
      return 'NAME THAT SONG'

    case 'name-the-artist':
      return 'NAME THE ARTIST'

    case 'name-the-album':
      return 'NAME THE ALBUM'

    case 'guess-the-year':
      return 'GUESS THE YEAR'
  }
}

function getQuestionPrompt(
  type: Question['type'],
) {
  switch (type) {
    case 'name-the-song':
      return 'What song is this?'

    case 'name-the-artist':
      return 'Who performs this song?'

    case 'name-the-album':
      return 'Which album is this from?'

    case 'guess-the-year':
      return 'When was this song released?'
  }
}

function EndlessGame() {
  const [question, setQuestion] =
    useState<Question | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isLoadingNext, setIsLoadingNext] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null)

  const [answerStatus, setAnswerStatus] =
    useState<AnswerStatus>('idle')

  const [listeningStage, setListeningStage] =
    useState(0)

  const [timeRemaining, setTimeRemaining] =
    useState(
      LISTENING_STAGES[0],
    )

  const [previewComplete, setPreviewComplete] =
    useState(false)

  const audioPlayerRef =
    useRef<AudioPlayerHandle | null>(null)

  async function loadQuestion() {
    const randomType =
      QUESTION_TYPES[
        Math.floor(
          Math.random() *
            QUESTION_TYPES.length,
        )
      ]

    console.log(
      'ENDLESS QUESTION TYPE:',
      randomType,
    )

    const generatedQuestion =
      await generateQuestion(
        randomType,
        'medium',
      )

    console.log(
      'ENDLESS QUESTION:',
      generatedQuestion,
    )

    return generatedQuestion
  }

  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true)
        setError(null)

        const generatedQuestion =
          await loadQuestion()

        setQuestion(
          generatedQuestion,
        )
      } catch (error) {
        console.error(
          'ENDLESS QUESTION ERROR:',
          error,
        )

        setError(
          'Failed to load the question.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  function handleTimeUpdate(
    currentTime: number,
  ) {
    if (
      answerStatus !== 'idle'
    ) {
      return
    }

    const stageDuration =
      LISTENING_STAGES[
        listeningStage
      ]

    const remaining =
      Math.max(
        stageDuration -
          currentTime,
        0,
      )

    setTimeRemaining(
      remaining,
    )
  }

  function handleStageComplete() {
    setTimeRemaining(0)
  }

  function handlePreviewComplete() {
    setPreviewComplete(true)
    setTimeRemaining(0)
  }

  function handleAnswer(
    answer: string,
  ) {
    if (
      !question ||
      answerStatus !== 'idle'
    ) {
      return
    }

    const isCorrect =
      answer ===
      question.correctAnswer

    console.log(
      'ENDLESS ANSWER:',
      {
        answer,
        correctAnswer:
          question.correctAnswer,
        isCorrect,
      },
    )

    setSelectedAnswer(answer)

    setAnswerStatus(
      isCorrect
        ? 'correct'
        : 'incorrect',
    )

    setPreviewComplete(false)

    audioPlayerRef.current
      ?.playPreview()
  }

  function handleAdvance() {
    if (
      answerStatus !== 'idle'
    ) {
      return
    }

    if (
      listeningStage >=
      LISTENING_STAGES.length - 1
    ) {
      audioPlayerRef.current
        ?.playPreview()

      return
    }

    const nextStage =
      listeningStage + 1

    console.log(
      'ENDLESS ADVANCE:',
      {
        from: listeningStage,
        to: nextStage,
      },
    )

    setListeningStage(
      nextStage,
    )

    setTimeRemaining(
      LISTENING_STAGES[
        nextStage
      ],
    )

    audioPlayerRef.current
      ?.playPreview()
  }

  function handleRevealAnswer() {
    if (
      !question ||
      answerStatus !== 'idle'
    ) {
      return
    }

    console.log(
      'ENDLESS ANSWER REVEALED:',
      question.correctAnswer,
    )

    audioPlayerRef.current
      ?.playPreview()

    setAnswerStatus(
      'revealed',
    )

    setSelectedAnswer(null)
    setPreviewComplete(false)
  }

  async function handleNextSong() {
    if (isLoadingNext) {
      return
    }

    console.log(
      'ENDLESS NEXT QUESTION',
    )

    setIsLoadingNext(true)
    setError(null)

    try {
      const nextQuestion =
        await loadQuestion()

      setQuestion(
        nextQuestion,
      )

      setSelectedAnswer(null)
      setAnswerStatus('idle')
      setListeningStage(0)

      setTimeRemaining(
        LISTENING_STAGES[0],
      )

      setPreviewComplete(false)
    } catch (error) {
      console.error(
        'ENDLESS NEXT QUESTION ERROR:',
        error,
      )

      setError(
        'Failed to load the next question.',
      )
    } finally {
      setIsLoadingNext(false)
    }
  }

  if (isLoading) {
    return (
      <div className="endless-game">
        <div className="endless-game__container">
          <p>LOADING...</p>
        </div>
      </div>
    )
  }

  if (
    error ||
    !question
  ) {
    return (
      <div className="endless-game">
        <div className="endless-game__container">
          <p>
            {error ??
              'Something went wrong.'}
          </p>
        </div>
      </div>
    )
  }

  const isAnswered =
    answerStatus !== 'idle'

  return (
    <div className="endless-game">
      <div className="endless-game__container">

        <p className="endless-game__mode">
          ENDLESS MODE
        </p>

        <h1>
          {getQuestionLabel(
            question.type,
          )}
        </h1>

        {!isAnswered && (
          <>
            <div className="endless-game__artwork endless-game__artwork--hidden">
              <span>?</span>
            </div>

            <h2>
              {getQuestionPrompt(
                question.type,
              )}
            </h2>
          </>
        )}

        <AudioPlayer
          key={question.id}
          ref={audioPlayerRef}
          audioUrl={
  question.song.audioUrl ??
  ''
}
          maxListenDuration={
            LISTENING_STAGES[
              listeningStage
            ]
          }
          onTimeUpdate={
            handleTimeUpdate
          }
          onStageComplete={
            handleStageComplete
          }
          onPreviewComplete={
            handlePreviewComplete
          }
          disabled={isAnswered}
        />

        {!isAnswered && (
          <>
            <div className="endless-game__stage">
              <span>
                LISTENING TIME
              </span>

              <strong>
                {timeRemaining.toFixed(1)}s
              </strong>
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

            <div className="endless-game__actions">
              <button
                type="button"
                className="endless-game__advance"
                onClick={
                  handleAdvance
                }
                disabled={
                  listeningStage >=
                  LISTENING_STAGES.length -
                    1
                }
              >
                ADVANCE
              </button>

              <button
                type="button"
                className="endless-game__reveal"
                onClick={
                  handleRevealAnswer
                }
              >
                GIVE UP
              </button>
            </div>
          </>
        )}

        {isAnswered && (
          <section
            className={`endless-game__reveal ${
              answerStatus ===
              'correct'
                ? 'endless-game__reveal--correct'
                : ''
            }`}
          >
            <div className="endless-game__reveal-heading">
              <span>
                {answerStatus ===
                'correct'
                  ? 'YOU GOT IT!'
                  : 'THE SONG WAS'}
              </span>

              <span className="endless-game__spark">
                ✦
              </span>
            </div>

            <div className="endless-game__song-card">
              <div className="endless-game__cover">
                {question.song.artworkUrl ? (
                  <img
                    src={
                      question.song.artworkUrl
                    }
                    alt={`${question.song.album} album artwork`}
                  />
                ) : (
                  <span>♪</span>
                )}
              </div>

              <div className="endless-game__song-info">
                <h2>
                  {question.song.title}
                </h2>

                <p className="endless-game__artist">
                  {question.song.artist}
                </p>

                <div className="endless-game__song-meta">
                  <span>
                    {question.song.album}
                  </span>

                  <span>
                    {question.song.releaseYear}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {isAnswered && (
          <div className="endless-game__next-area">
            {!previewComplete && (
              <div className="endless-game__next-status">
                PREVIEW PLAYING — YOU CAN MOVE ON
              </div>
            )}

            <button
              type="button"
              className="endless-game__next"
              onClick={
                handleNextSong
              }
              disabled={
                isLoadingNext
              }
            >
              {isLoadingNext
                ? 'LOADING...'
                : 'NEXT SONG →'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default EndlessGame
