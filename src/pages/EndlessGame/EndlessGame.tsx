import {
  useEffect,
  useRef,
  useState,
} from 'react'

import AudioPlayer, {
  type AudioPlayerHandle,
} from '../../components/game/AudioPlayer'

import AnswerGrid from '../../components/game/AnswerGrid'

import LoadingScreen from '../../components/loading/LoadingScreen'

import {
  generateQuestion,
  getLoadingFacts,
  type LoadingFact,
} from '../../services/gameService'

import type { Question } from '../../types/game'

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

  const [loadingFacts, setLoadingFacts] =
    useState<LoadingFact[]>([])

  const [
    loadingComplete,
    setLoadingComplete,
  ] = useState(false)

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null)

  const [answerStatus, setAnswerStatus] =
    useState<AnswerStatus>('idle')

  const [listeningStage, setListeningStage] =
    useState(0)

  const [timeRemaining, setTimeRemaining] =
    useState(LISTENING_STAGES[0])

  const [previewComplete, setPreviewComplete] =
    useState(false)

  const audioPlayerRef =
    useRef<AudioPlayerHandle | null>(null)

  async function loadQuestion() {
    const randomIndex =
      Math.floor(
        Math.random() *
          QUESTION_TYPES.length,
      )

    const questionType =
      QUESTION_TYPES[randomIndex]

    return generateQuestion(
      questionType,
      'medium',
    )
  }

  useEffect(() => {
    let isMounted = true

    async function initialize() {
      setIsLoading(true)
      setLoadingComplete(false)
      setError(null)

      /*
       * Loading facts are fetched independently
       * from the game data.
       */
      getLoadingFacts()
  .then(data => {
    if (isMounted) {
      setLoadingFacts(data)
    }
  })
  .catch(error => {
    console.error(
      'Failed to load loading facts:',
      error,
    )
  })

      try {
        const generatedQuestion =
          await loadQuestion()

        if (isMounted) {
          setQuestion(
            generatedQuestion,
          )

          /*
           * The Endless question has
           * finished loading successfully.
           */
          setLoadingComplete(true)
          setIsLoading(false)
        }
      } catch (error) {
        console.error(
          'ENDLESS QUESTION ERROR:',
          error,
        )

        if (isMounted) {
          setError(
            'Failed to load the question.',
          )

          setIsLoading(false)
        }
      }
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [])

  function handleTimeUpdate(
    currentTime: number,
  ) {
    if (answerStatus !== 'idle') {
      return
    }

    const stageDuration =
      LISTENING_STAGES[
        listeningStage
      ]

    setTimeRemaining(
      Math.max(
        stageDuration -
          currentTime,
        0,
      ),
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

    setSelectedAnswer(answer)

    setAnswerStatus(
      isCorrect
        ? 'correct'
        : 'incorrect',
    )

    setPreviewComplete(false)

    audioPlayerRef.current?.playPreview()
  }

  function handleAdvance() {
    if (
      answerStatus !== 'idle' ||
      listeningStage >=
        LISTENING_STAGES.length - 1
    ) {
      return
    }

    const nextStage =
      listeningStage + 1

    setListeningStage(
      nextStage,
    )

    setTimeRemaining(
      LISTENING_STAGES[
        nextStage
      ],
    )

    setPreviewComplete(false)

    audioPlayerRef.current?.playPreview()
  }

  function handleRevealAnswer() {
    if (
      !question ||
      answerStatus !== 'idle'
    ) {
      return
    }

    audioPlayerRef.current?.playPreview()

    setAnswerStatus('revealed')
    setSelectedAnswer(null)
    setPreviewComplete(false)
  }

  async function handleNextSong() {
    if (isLoadingNext) {
      return
    }

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
      <LoadingScreen
        facts={loadingFacts}
        message="Loading Endless Mode..."
        isComplete={loadingComplete}
      />
    )
  }

  if (error || !question) {
    return (
      <div className="endless-game">
        <div className="endless-game__container">
          <p className="endless-game__status-message">
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

        <header className="endless-game__header">
          <p className="endless-game__eyebrow">
            ENDLESS MODE
          </p>

          <h1>
            {getQuestionLabel(
              question.type,
            )}
          </h1>
        </header>

        <main className="endless-game__board">

          <section className="endless-game__question">

            <div
              className={`endless-game__artwork ${
                !isAnswered
                  ? 'endless-game__artwork--hidden'
                  : ''
              }`}
            >
              {isAnswered ? (
                question.song.artworkUrl ? (
                  <img
                    src={
                      question.song.artworkUrl
                    }
                    alt={`${question.song.album} album artwork`}
                  />
                ) : (
                  <span>♪</span>
                )
              ) : (
                <span>?</span>
              )}
            </div>

            <div className="endless-game__audio">

              <AudioPlayer
                key={question.id}
                ref={
                  audioPlayerRef
                }
                audioUrl={
                  question.song
                    .audioUrl ?? ''
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
                disabled={
                  isAnswered
                }
              />

              {!isAnswered && (
                <>
                  <div className="endless-game__stage-info">

                    <div>
                      <span>
                        STAGE
                      </span>

                      <strong>
                        {listeningStage + 1}
                        {' / '}
                        {
                          LISTENING_STAGES.length
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        LISTENING TIME
                      </span>

                      <strong>
                        {timeRemaining.toFixed(
                          1,
                        )}s
                      </strong>
                    </div>

                  </div>

                  <div className="endless-game__stage-bar">

                    {LISTENING_STAGES.map(
                      (_, index) => (
                        <span
                          key={index}
                          className={
                            index <=
                            listeningStage
                              ? 'endless-game__stage-segment endless-game__stage-segment--active'
                              : 'endless-game__stage-segment'
                          }
                        />
                      ),
                    )}

                  </div>
                </>
              )}

            </div>

          </section>

          <section className="endless-game__play-panel">

            {!isAnswered ? (
              <>
                <div className="endless-game__prompt">

                  <span>
                    {getQuestionLabel(
                      question.type,
                    )}
                  </span>

                  <h2>
                    {getQuestionPrompt(
                      question.type,
                    )}
                  </h2>

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
                  isAnswered={false}
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
                    className="endless-game__give-up"
                    onClick={
                      handleRevealAnswer
                    }
                  >
                    GIVE UP
                  </button>

                </div>
              </>
            ) : (
              <>
                <div
                  className={`endless-game__reveal ${
                    answerStatus ===
                    'correct'
                      ? 'endless-game__reveal--correct'
                      : answerStatus ===
                          'incorrect'
                        ? 'endless-game__reveal--incorrect'
                        : 'endless-game__reveal--revealed'
                  }`}
                >

                  <div className="endless-game__reveal-heading">

                    <span>
                      {answerStatus ===
                      'correct'
                        ? 'YOU GOT IT!'
                        : answerStatus ===
                            'incorrect'
                          ? 'NOT QUITE'
                          : 'THE ANSWER WAS'}
                    </span>

                    <span>
                      ✦
                    </span>

                  </div>

                  <div className="endless-game__song-card">

                    <div className="endless-game__song-info">

                      <h2>
                        {
                          question.song.title
                        }
                      </h2>

                      <p>
                        {
                          question.song.artist
                        }
                      </p>

                      <div className="endless-game__song-meta">

                        <span>
                          {
                            question.song.album
                          }
                        </span>

                        <span>
                          {
                            question.song.releaseYear
                          }
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

                <div className="endless-game__next-area">

                  {!previewComplete && (
                    <p className="endless-game__next-status">
                      PREVIEW PLAYING — YOU CAN MOVE ON
                    </p>
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
              </>
            )}

          </section>

        </main>

      </div>
    </div>
  )
}

export default EndlessGame

