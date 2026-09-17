import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'

import AudioPlayer from '../../components/game/AudioPlayer'
import type { AudioPlayerHandle } from '../../components/game/AudioPlayer'
import AnswerGrid from '../../components/game/AnswerGrid'
import GameHeader from '../../components/game/GameHeader'
import GameProgress from '../../components/game/GameProgress'
import ResultsScreen from '../../components/game/ResultsScreen'

import { defaultRound } from '../../data/defaultRound'

import {
  generateQuestion,
} from '../../services/gameService'

import {
  calculateFinalPoints,
  calculatePoints,
  calculateStreakMultiplier,
} from '../../lib/gameScoring'

import {
  submitScore,
} from '../../services/scoreService'

import type {
  Question,
  RoundConfig,
} from '../../types/game'

import './Game.css'

const LISTENING_STAGES = [
  0.1,
  0.5,
  2,
  8,
  15,
]

type AnswerStatus =
  | 'idle'
  | 'correct'
  | 'incorrect'
  | 'revealed'

export type RecognitionResult = {
  questionNumber: number
  title: string
  artist: string
  listenDuration: number
  points: number
  correct: boolean
}

function getGameMode(
  questionType: Question['type'],
) {
  switch (questionType) {
    case 'name-the-song':
      return 'name-that-song'

    case 'name-the-artist':
      return 'name-the-artist'

    case 'name-the-album':
      return 'name-the-album'

    case 'guess-the-year':
      return 'guess-the-year'

    default:
      return 'name-that-song'
  }
}

function Game() {
  const location = useLocation()

  const roundConfig =
    (
      location.state as {
        roundConfig?: RoundConfig
      } | null
    )?.roundConfig ?? defaultRound

  /*
   * --------------------------------------------------
   * QUESTION STATE
   * --------------------------------------------------
   */

  const [questions, setQuestions] =
    useState<Question[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [isLoadingNext, setIsLoadingNext] =
    useState(false)

  const [currentQuestion, setCurrentQuestion] =
    useState(0)

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
   * SCORE STATE
   * --------------------------------------------------
   */

  const [score, setScore] =
    useState(0)

  const [streak, setStreak] =
    useState(0)

  const [bestStreak, setBestStreak] =
    useState(0)

  const [correctAnswers, setCorrectAnswers] =
    useState(0)

  const [pointsEarned, setPointsEarned] =
    useState(0)

  const [multiplierEarned, setMultiplierEarned] =
    useState(1)

  /*
   * --------------------------------------------------
   * RECOGNITION / RESULTS
   * --------------------------------------------------
   */

  const [
    recognitionResults,
    setRecognitionResults,
  ] = useState<RecognitionResult[]>([])

  /*
   * --------------------------------------------------
   * LISTENING STATE
   * --------------------------------------------------
   */

  const [listeningStage, setListeningStage] =
    useState(0)

  const [timeRemaining, setTimeRemaining] =
    useState(LISTENING_STAGES[0])

  /*
   * --------------------------------------------------
   * FULL PREVIEW STATE
   * --------------------------------------------------
   */

  const [previewComplete, setPreviewComplete] =
    useState(false)

  /*
   * --------------------------------------------------
   * GAME STATE
   * --------------------------------------------------
   */

  const [isGameComplete, setIsGameComplete] =
    useState(false)

  const scoreSubmitted =
    useRef(false)

  /*
   * --------------------------------------------------
   * AUDIO PLAYER REF
   * --------------------------------------------------
   */

  const audioPlayerRef =
    useRef<AudioPlayerHandle | null>(null)

  /*
   * --------------------------------------------------
   * LOAD FIRST QUESTION
   * --------------------------------------------------
   */

  useEffect(() => {
    let isMounted = true

    async function loadFirstQuestion() {
      setIsLoading(true)

      try {
        const firstType =
          roundConfig.questionTypes[0]

        const firstQuestion =
          await generateQuestion(
            firstType,
            roundConfig.difficulty,
            roundConfig.decade,
          )

        if (isMounted) {
          setQuestions([firstQuestion])
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
   * --------------------------------------------------
   * PRELOAD NEXT QUESTION
   * --------------------------------------------------
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
            roundConfig.decade,
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
   * --------------------------------------------------
   * SAVE SCORE
   * --------------------------------------------------
   *
   * This hook must remain above all conditional
   * returns so React always calls hooks in the
   * same order.
   */

  useEffect(() => {
    if (
      !isGameComplete ||
      scoreSubmitted.current
    ) {
      return
    }

    scoreSubmitted.current = true

    const totalListeningTime =
      recognitionResults.reduce(
        (total, result) =>
          total + result.listenDuration,
        0,
      )

    const accuracy =
      roundConfig.questionCount > 0
        ? (correctAnswers /
            roundConfig.questionCount) *
          100
        : 0

    async function saveScore() {
      try {
        await submitScore({
          gameMode: getGameMode(
            roundConfig.questionTypes[0],
          ),
          score,
          accuracy,
          bestStreak,
          questions:
            roundConfig.questionCount,
          correctAnswers,
          totalListeningTime,
        })

        console.log(
          'GAME SCORE SAVED:',
          {
            score,
            accuracy,
            bestStreak,
            questions:
              roundConfig.questionCount,
            correctAnswers,
            totalListeningTime,
          },
        )
      } catch (error) {
        console.error(
          'FAILED TO SAVE GAME SCORE:',
          error,
        )
      }
    }

    saveScore()
  }, [
    isGameComplete,
    score,
    correctAnswers,
    bestStreak,
    recognitionResults,
    roundConfig.questionCount,
    roundConfig.questionTypes,
  ])

  /*
   * --------------------------------------------------
   * LOADING STATE
   * --------------------------------------------------
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
   * --------------------------------------------------
   * NO QUESTIONS
   * --------------------------------------------------
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

  /*
   * --------------------------------------------------
   * CURRENT QUESTION
   * --------------------------------------------------
   */

  const question =
    questions[currentQuestion]

  const isAnswered =
    answerStatus !== 'idle'

  const maxListenDuration =
    LISTENING_STAGES[listeningStage]

  /*
   * --------------------------------------------------
   * AUDIO TIMER
   * --------------------------------------------------
   */

  function handleTimeUpdate(
    time: number,
  ) {
    if (!isAnswered) {
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
   * RECORD RECOGNITION
   * --------------------------------------------------
   */

  function recordRecognition(
    result: RecognitionResult,
  ) {
    setRecognitionResults(
      (current) => [
        ...current,
        result,
      ],
    )
  }

  /*
   * --------------------------------------------------
   * ANSWER QUESTION
   * --------------------------------------------------
   */

  function handleAnswer(
    answer: string,
  ) {
    if (isAnswered) {
      return
    }

    const isCorrect =
      answer === question.correctAnswer

    /*
     * Start the full preview directly from the
     * user's answer click.
     */

    audioPlayerRef.current?.playPreview()

    setSelectedAnswer(answer)

    setAnswerStatus(
      isCorrect
        ? 'correct'
        : 'incorrect',
    )

    setPreviewComplete(false)

    /*
     * ----------------------------------------------
     * CORRECT
     * ----------------------------------------------
     */

    if (isCorrect) {
      const nextStreak =
        streak + 1

      const multiplier =
        calculateStreakMultiplier(
          nextStreak,
        )

      const basePoints =
        calculatePoints(
          maxListenDuration,
        )

      const points =
        calculateFinalPoints(
          basePoints,
          multiplier,
        )

      setStreak(nextStreak)

      setBestStreak(
        (previous) =>
          Math.max(
            previous,
            nextStreak,
          ),
      )

      setScore(
        (previous) =>
          previous + points,
      )

      setCorrectAnswers(
        (previous) =>
          previous + 1,
      )

      setPointsEarned(points)

      setMultiplierEarned(
        multiplier,
      )

      recordRecognition({
        questionNumber:
          currentQuestion + 1,

        title:
          question.song.title,

        artist:
          question.song.artist,

        listenDuration:
          maxListenDuration,

        points,

        correct: true,
      })

      return
    }

    /*
     * ----------------------------------------------
     * INCORRECT
     * ----------------------------------------------
     */

    setStreak(0)
    setPointsEarned(0)
    setMultiplierEarned(1)

    recordRecognition({
      questionNumber:
        currentQuestion + 1,

      title:
        question.song.title,

      artist:
        question.song.artist,

      listenDuration:
        maxListenDuration,

      points: 0,

      correct: false,
    })
  }

  /*
   * --------------------------------------------------
   * ADVANCE LISTENING STAGE
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * REVEAL ANSWER
   * --------------------------------------------------
   */

  function handleRevealAnswer() {
    if (isAnswered) {
      return
    }

    /*
     * Start the full preview directly from the
     * user's Reveal Answer click.
     */

    audioPlayerRef.current?.playPreview()

    setAnswerStatus('revealed')
    setSelectedAnswer(null)

    setStreak(0)
    setPointsEarned(0)
    setMultiplierEarned(1)

    setPreviewComplete(false)

    recordRecognition({
      questionNumber:
        currentQuestion + 1,

      title:
        question.song.title,

      artist:
        question.song.artist,

      listenDuration:
        maxListenDuration,

      points: 0,

      correct: false,
    })
  }

  /*
   * --------------------------------------------------
   * RESET QUESTION STATE
   * --------------------------------------------------
   */

  function resetQuestionState() {
    setSelectedAnswer(null)

    setAnswerStatus('idle')

    setListeningStage(0)

    setPointsEarned(0)

    setMultiplierEarned(1)

    setPreviewComplete(false)

    setTimeRemaining(
      LISTENING_STAGES[0],
    )
  }

  /*
   * --------------------------------------------------
   * NEXT SONG
   * --------------------------------------------------
   */

  async function handleNextSong() {
    /*
     * Last question.
     */

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
     * The next question has already been
     * preloaded.
     */

    if (questions[nextIndex]) {
      setCurrentQuestion(nextIndex)

      resetQuestionState()

      return
    }

    /*
     * Otherwise generate it now.
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
          roundConfig.decade,
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
   * --------------------------------------------------
   * RESULTS SCREEN
   * --------------------------------------------------
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
        bestStreak={
          bestStreak
        }
        recognitionResults={
          recognitionResults
        }
      />
    )
  }

  /*
   * --------------------------------------------------
   * GAME UI
   * --------------------------------------------------
   */

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

          {/* CATEGORY */}

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

          {/* QUESTION */}

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

          {/* SONG */}

          <div className="game-question">

            {/* ARTWORK */}

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

            {/* AUDIO PLAYER */}

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

            {/* SONG DETAILS */}

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
            <div className="game-actions">

              <button
                type="button"
                className="game-advance"
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
                className="game-reveal"
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
              className={`game-feedback ${
                answerStatus ===
                'revealed'
                  ? 'game-feedback--timeout'
                  : answerStatus ===
                      'correct'
                    ? 'game-feedback--correct'
                    : 'game-feedback--incorrect'
              }`}
            >

              <div className="game-feedback__label">
                {answerStatus ===
                'revealed'
                  ? 'ANSWER REVEALED'
                  : answerStatus ===
                      'correct'
                    ? 'CORRECT'
                    : 'INCORRECT'}
              </div>

              <div className="game-feedback__answer">
                {
                  question.correctAnswer
                }
              </div>

              {/* CORRECT POINTS */}

              {answerStatus ===
                'correct' && (
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

              {/* PREVIEW STATUS */}

              <div className="game-feedback__points">
                {previewComplete
                  ? 'PREVIEW COMPLETE'
                  : 'PREVIEW CONTINUES'}
              </div>

            </div>
          )}

          {/* GAME STATUS */}

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

          {/* NEXT SONG */}

          {isAnswered && (
            <div className="game-next-area">

              {!previewComplete && (
                <div className="game-next-status">
                  <span>
                    PREVIEW PLAYING
                  </span>
                </div>
              )}

              <button
                type="button"
                className="game-next"
                onClick={
                  handleNextSong
                }
                disabled={
                  isLoadingNext
                }
              >
                {isLoadingNext
                  ? 'LOADING...'
                  : currentQuestion >=
                      roundConfig.questionCount - 1
                    ? 'SEE RESULTS'
                    : 'NEXT SONG →'}
              </button>

            </div>
          )}

        </main>
      </div>
    </div>
  )
}

export default Game
