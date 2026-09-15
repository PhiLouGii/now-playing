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

function EndlessGame() {
  /*
   * --------------------------------------------------
   * QUESTION STATE
   * --------------------------------------------------
   */

  const [question, setQuestion] =
    useState<Question | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isLoadingNext, setIsLoadingNext] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  /*
   * --------------------------------------------------
   * ANSWER STATE
   * --------------------------------------------------
   */

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null)

  const [answerStatus, setAnswerStatus] =
    useState<AnswerStatus>('idle')

  /*
   * --------------------------------------------------
   * LISTENING STATE
   * --------------------------------------------------
   */

  const [listeningStage, setListeningStage] =
    useState(0)

  const [timeRemaining, setTimeRemaining] =
    useState(LISTENING_STAGES[0])

  const [previewComplete, setPreviewComplete] =
    useState(false)

  /*
   * --------------------------------------------------
   * AUDIO PLAYER REF
   * --------------------------------------------------
   */

  const audioPlayerRef =
    useRef<AudioPlayerHandle | null>(null)

  /*
   * --------------------------------------------------
   * GENERATE QUESTION
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * LOAD FIRST QUESTION
   * --------------------------------------------------
   */

  useEffect(() => {
    let isMounted = true

    async function loadFirstQuestion() {
      try {
        setIsLoading(true)
        setError(null)

        const generatedQuestion =
          await loadQuestion()

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

    loadFirstQuestion()

    return () => {
      isMounted = false
    }
  }, [])

  /*
   * --------------------------------------------------
   * QUESTION LABEL
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * QUESTION PROMPT
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * AUDIO TIMER
   * --------------------------------------------------
   */

  function handleTimeUpdate(
    time: number,
  ) {
    if (
      answerStatus === 'idle'
    ) {
      setTimeRemaining(time)
    }
  }

  /*
   * --------------------------------------------------
   * LISTENING STAGE COMPLETE
   * --------------------------------------------------
   */

  function handleStageComplete() {
    setTimeRemaining(0)
  }

  /*
   * --------------------------------------------------
   * FULL PREVIEW COMPLETE
   * --------------------------------------------------
   */

  function handlePreviewComplete() {
    setPreviewComplete(true)
    setTimeRemaining(0)
  }

  /*
   * --------------------------------------------------
   * ANSWER QUESTION
   * --------------------------------------------------
   */

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
      answer === question.correctAnswer

    console.log(
      'ENDLESS ANSWER:',
      answer,
      'CORRECT:',
      isCorrect,
    )

    /*
     * Start the full preview directly
     * from the user's answer click.
     */

    audioPlayerRef.current?.playPreview()

    setSelectedAnswer(answer)

    setAnswerStatus(
      isCorrect
        ? 'correct'
        : 'incorrect',
    )

    setPreviewComplete(false)
  }

  /*
   * --------------------------------------------------
   * ADVANCE LISTENING STAGE
   * --------------------------------------------------
   */

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
      return
    }

    const nextStage =
      listeningStage + 1

    console.log(
      'ENDLESS ADVANCE:',
      LISTENING_STAGES[nextStage],
      'seconds',
    )

    setListeningStage(nextStage)

    setTimeRemaining(
      LISTENING_STAGES[nextStage],
    )
  }

  /*
   * --------------------------------------------------
   * REVEAL ANSWER
   * --------------------------------------------------
   */

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

    audioPlayerRef.current?.playPreview()

    setAnswerStatus('revealed')

    setSelectedAnswer(null)

    setPreviewComplete(false)
  }

  /*
   * --------------------------------------------------
   * NEXT QUESTION
   * --------------------------------------------------
   */

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

      /*
       * Reset the entire question state.
       */

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

  /*
   * --------------------------------------------------
   * LOADING STATE
   * --------------------------------------------------
   */

  if (isLoading) {
    return (
      <main className="endless-game">
        <div className="endless-game__container">
          <p className="endless-game__mode">
            ENDLESS MODE
          </p>

          <h1>
            LOADING...
          </h1>
        </div>
      </main>
    )
  }

  /*
   * --------------------------------------------------
   * ERROR STATE
   * --------------------------------------------------
   */

  if (error || !question) {
    return (
      <main className="endless-game">
        <div className="endless-game__container">
          <p className="endless-game__mode">
            ENDLESS MODE
          </p>

          <h1>
            NO QUESTION AVAILABLE
          </h1>

          <p>
            {error ||
              'We could not generate a question right now.'}
          </p>
        </div>
      </main>
    )
  }

  const isAnswered =
    answerStatus !== 'idle'

  const maxListenDuration =
    LISTENING_STAGES[listeningStage]

  return (
    <main className="endless-game">
      <div className="endless-game__container">

        {/* MODE */}

        <p className="endless-game__mode">
          ENDLESS MODE
        </p>

        {/* QUESTION TYPE */}

        <h1>
          {getQuestionLabel(
            question.type,
          )}
        </h1>

        {/* ARTWORK */}

        <div
          className={`endless-game__artwork ${
            isAnswered
              ? 'endless-game__artwork--revealed'
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

        {/* AUDIO */}

        <AudioPlayer
          ref={audioPlayerRef}
          key={question.id}
          audioUrl={
            question.song.audioUrl ?? ''
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
          onPreviewComplete={
            handlePreviewComplete
          }
          disabled={false}
          playFullSong={
            answerStatus ===
            'revealed'
          }
        />

        {/* QUESTION */}

        <h2>
          {getQuestionPrompt(
            question.type,
          )}
        </h2>

        {/* ANSWERS */}

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

        {/* BEFORE ANSWER */}

        {!isAnswered && (
          <div className="endless-game__actions">

            <button
              type="button"
              className="endless-game__advance"
              onClick={
                handleAdvance
              }
              disabled={
                listeningStage >=
                LISTENING_STAGES.length - 1
              }
            >
              {listeningStage <
              LISTENING_STAGES.length - 1
                ? `ADVANCE → ${
                    LISTENING_STAGES[
                      listeningStage + 1
                    ]
                  }s`
                : 'MAX LISTEN TIME'}
            </button>

            <button
              type="button"
              className="endless-game__reveal"
              onClick={
                handleRevealAnswer
              }
            >
              REVEAL ANSWER
            </button>

          </div>
        )}

        {/* ANSWER FEEDBACK */}

        {isAnswered && (
          <div
            className={`endless-game__feedback ${
              answerStatus ===
              'revealed'
                ? 'endless-game__feedback--revealed'
                : answerStatus ===
                    'correct'
                  ? 'endless-game__feedback--correct'
                  : 'endless-game__feedback--incorrect'
            }`}
          >
            <div className="endless-game__feedback-label">
              {answerStatus ===
              'revealed'
                ? 'ANSWER REVEALED'
                : answerStatus ===
                    'correct'
                  ? 'CORRECT'
                  : 'INCORRECT'}
            </div>

            <div className="endless-game__feedback-answer">
              {
                question.correctAnswer
              }
            </div>

            <div className="endless-game__preview-status">
              {previewComplete
                ? 'PREVIEW COMPLETE'
                : 'PREVIEW PLAYING'}
            </div>
          </div>
        )}

        {/* GAME STATUS */}

        <div className="endless-game__status">

          <div>
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

          <div>
            <span>
              STAGE
            </span>

            <strong>
              {listeningStage + 1}
              /
              {LISTENING_STAGES.length}
            </strong>
          </div>

        </div>

        {/* NEXT QUESTION */}

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
    </main>
  )
}

export default EndlessGame