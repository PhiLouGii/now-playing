import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  useLocation,
  useSearchParams,
} from 'react-router-dom'

import AudioPlayer from '../../components/game/AudioPlayer'
import type {
  AudioPlayerHandle,
} from '../../components/game/AudioPlayer'

import AnswerGrid from '../../components/game/AnswerGrid'
import GameHeader from '../../components/game/GameHeader'
import GameProgress from '../../components/game/GameProgress'
import ResultsScreen from '../../components/game/ResultsScreen'
import LoadingScreen from '../../components/loading/LoadingScreen'

import { defaultRound } from '../../data/defaultRound'

import {
  generateQuestion,
  generateEraRound,
  generateGenreRound,
  getLoadingFacts,
  type EraKey,
  type GenreKey,
  type LoadingFact,
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

/* =========================================================
   GAME MODE
   ========================================================= */

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

/* =========================================================
   GAME
   ========================================================= */

function Game() {
  const location = useLocation()

  const [searchParams] =
    useSearchParams()

  const categoryId =
    searchParams.get('category') ??
    undefined

  const roundConfig =
    (
      location.state as {
        roundConfig?: RoundConfig
      } | null
    )?.roundConfig ??
    defaultRound

  const [questions, setQuestions] =
    useState<Question[]>([])

  const usedTrackIds =
    useRef<Set<string>>(
      new Set(),
    )

  const [isLoading, setIsLoading] =
    useState(true)

  const [loadingFacts, setLoadingFacts] =
    useState<LoadingFact[]>([])

  const [
    loadingComplete,
    setLoadingComplete,
  ] = useState(false)

  const [isLoadingNext, setIsLoadingNext] =
    useState(false)

  const [currentQuestion, setCurrentQuestion] =
    useState(0)

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null)

  const [answerStatus, setAnswerStatus] =
    useState<AnswerStatus>('idle')

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

  const [
    recognitionResults,
    setRecognitionResults,
  ] = useState<RecognitionResult[]>([])

  const [listeningStage, setListeningStage] =
    useState(0)

  const [timeRemaining, setTimeRemaining] =
    useState(LISTENING_STAGES[0])

  const [previewComplete, setPreviewComplete] =
    useState(false)

  const [isGameComplete, setIsGameComplete] =
    useState(false)

  const scoreSubmitted =
    useRef(false)

  const audioPlayerRef =
    useRef<AudioPlayerHandle | null>(null)

  /* =========================================================
     ROUND TYPE HELPERS
     ========================================================= */

  const isEraRound =
    roundConfig.decade !== undefined

  const isGenreRound =
    roundConfig.genre !== undefined

  const isCuratedRound =
    isEraRound ||
    isGenreRound

  /* =========================================================
     LOAD ROUND
     ========================================================= */

  useEffect(() => {
    let isMounted = true

    async function loadFirstQuestion() {
      setIsLoading(true)
      setLoadingComplete(false)

      usedTrackIds.current.clear()

      /*
       * Loading facts are fetched independently from
       * the game data so they do not become another
       * unnecessary reason for the game to wait.
       */
      getLoadingFacts()
        .then(data => {
          if (isMounted) {
            setLoadingFacts(
              data.facts,
            )
          }
        })
        .catch(error => {
          console.error(
            'Failed to load loading facts:',
            error,
          )
        })

      try {
        /*
         * Curated era rounds load the complete
         * round from the Firestore era library.
         */
        if (
          roundConfig.decade !==
          undefined
        ) {
          const era =
            `${roundConfig.decade}s` as EraKey

          const eraQuestions =
            await generateEraRound(
              era,
              roundConfig.questionCount,
              roundConfig.questionTypes,
              roundConfig.difficulty,
            )

          if (isMounted) {
            eraQuestions.forEach(
              question => {
                usedTrackIds.current.add(
                  question.song.id,
                )
              },
            )

            setQuestions(
              eraQuestions,
            )

            /*
             * The actual game data has finished
             * loading successfully.
             */
            setLoadingComplete(true)

            setIsLoading(false)
          }

          return
        }

        /*
         * Curated genre rounds load the complete
         * round from the Firestore genre library.
         */
        if (
          roundConfig.genre
        ) {
          const genre =
            roundConfig.genre as GenreKey

          const genreQuestions =
            await generateGenreRound(
              genre,
              roundConfig.questionCount,
              roundConfig.questionTypes,
              roundConfig.difficulty,
            )

          if (isMounted) {
            genreQuestions.forEach(
              question => {
                usedTrackIds.current.add(
                  question.song.id,
                )
              },
            )

            setQuestions(
              genreQuestions,
            )

            /*
             * The actual game data has finished
             * loading successfully.
             */
            setLoadingComplete(true)

            setIsLoading(false)
          }

          return
        }

        /*
         * All other game modes continue
         * using the existing generator.
         */
        const firstType =
          roundConfig.questionTypes[0]

        const firstQuestion =
          await generateQuestion(
            firstType,
            roundConfig.difficulty,
            roundConfig.decade,
            [],
            categoryId,
          )

        if (isMounted) {
          usedTrackIds.current.add(
            firstQuestion.song.id,
          )

          setQuestions([
            firstQuestion,
          ])

          /*
           * The actual game data has finished
           * loading successfully.
           */
          setLoadingComplete(true)

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

  /* =========================================================
     PRELOAD NORMAL GAME QUESTIONS
     ========================================================= */

  useEffect(() => {
    /*
     * Curated era and genre rounds are
     * already loaded completely.
     */
    if (isCuratedRound) {
      return
    }

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
            Array.from(
              usedTrackIds.current,
            ),
            categoryId,
          )

        if (isMounted) {
          setQuestions(
            current => {
              if (
                current.length >
                nextIndex
              ) {
                return current
              }

              usedTrackIds.current.add(
                nextQuestion.song.id,
              )

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
    isCuratedRound,
  ])

  /* =========================================================
     SAVE SCORE
     ========================================================= */

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
          total +
          result.listenDuration,
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

  /* =========================================================
     LOADING
     ========================================================= */

  if (isLoading) {
    return (
      <LoadingScreen
        facts={loadingFacts}
        message={`Loading ${roundConfig.name}...`}
        isComplete={loadingComplete}
      />
    )
  }

  /* =========================================================
     NO QUESTIONS
     ========================================================= */

  if (questions.length === 0) {
    return (
      <div className="game-page">
        <div className="game-page__container">

          <main className="game-content game-content--loading">

            <p className="game-content__category">
              {roundConfig.name.toUpperCase()}
            </p>

            <h1>
              NO QUESTIONS AVAILABLE
            </h1>

            <p>
              We couldn't generate a
              round right now.
            </p>

          </main>

        </div>
      </div>
    )
  }

  /* =========================================================
     RESULTS
     ========================================================= */

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

  const question =
    questions[currentQuestion]

  const isAnswered =
    answerStatus !== 'idle'

  const maxListenDuration =
    LISTENING_STAGES[
      listeningStage
    ]

  /* =========================================================
     AUDIO
     ========================================================= */

  function handleTimeUpdate(
    time: number,
  ) {
    if (!isAnswered) {
      setTimeRemaining(time)
    }
  }

  function handleStageComplete() {
    setTimeRemaining(0)
  }

  function handlePreviewComplete() {
    setPreviewComplete(true)
    setTimeRemaining(0)
  }

  /* =========================================================
     RECOGNITION
     ========================================================= */

  function recordRecognition(
    result: RecognitionResult,
  ) {
    setRecognitionResults(
      current => [
        ...current,
        result,
      ],
    )
  }

  /* =========================================================
     ANSWER
     ========================================================= */

  function handleAnswer(
    answer: string,
  ) {
    if (isAnswered) {
      return
    }

    const isCorrect =
      answer ===
      question.correctAnswer

    audioPlayerRef.current?.playPreview()

    setSelectedAnswer(answer)

    setAnswerStatus(
      isCorrect
        ? 'correct'
        : 'incorrect',
    )

    setPreviewComplete(false)

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

      setStreak(
        nextStreak,
      )

      setBestStreak(
        previous =>
          Math.max(
            previous,
            nextStreak,
          ),
      )

      setScore(
        previous =>
          previous + points,
      )

      setCorrectAnswers(
        previous =>
          previous + 1,
      )

      setPointsEarned(
        points,
      )

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

  /* =========================================================
     LISTENING STAGE
     ========================================================= */

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

    setListeningStage(
      nextStage,
    )

    setTimeRemaining(
      LISTENING_STAGES[
        nextStage
      ],
    )
  }

  /* =========================================================
     REVEAL ANSWER
     ========================================================= */

  function handleRevealAnswer() {
    if (isAnswered) {
      return
    }

    audioPlayerRef.current?.playPreview()

    setAnswerStatus(
      'revealed',
    )

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

  /* =========================================================
     RESET QUESTION STATE
     ========================================================= */

  function resetQuestionState() {
    setSelectedAnswer(null)

    setAnswerStatus(
      'idle',
    )

    setListeningStage(0)

    setPointsEarned(0)

    setMultiplierEarned(1)

    setPreviewComplete(false)

    setTimeRemaining(
      LISTENING_STAGES[0],
    )
  }

  /* =========================================================
     NEXT SONG
     ========================================================= */

  async function handleNextSong() {
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
     * Curated era and genre rounds
     * have already loaded all questions.
     */
    if (questions[nextIndex]) {
      setCurrentQuestion(
        nextIndex,
      )

      resetQuestionState()

      return
    }

    /*
     * Fallback for normal game modes
     * that load questions individually.
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
          Array.from(
            usedTrackIds.current,
          ),
          categoryId,
        )

      usedTrackIds.current.add(
        nextQuestion.song.id,
      )

      setQuestions(
        current => {
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

      setCurrentQuestion(
        nextIndex,
      )

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

  /* =========================================================
     RENDER
     ========================================================= */

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

          <div className="game-content__heading">

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

              {categoryId
                ? categoryId
                    .replace(
                      /-/g,
                      ' ',
                    )
                    .toUpperCase()
                : roundConfig.name.toUpperCase()}

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

          </div>

          <div className="game-board">

            <section className="game-question">

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
                ref={
                  audioPlayerRef
                }
                key={
                  question.id
                }
                audioUrl={
                  question.song
                    .audioUrl ?? ''
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

              {isAnswered && (
                <div className="game-song-reveal">

                  <p className="game-song-reveal__title">
                    {
                      question.song.title
                    }
                  </p>

                  <p className="game-song-reveal__artist">
                    {
                      question.song.artist
                    }
                  </p>

                  <p className="game-song-reveal__album">
                    {
                      question.song.album
                    }
                  </p>

                  {question.type ===
                    'guess-the-year' &&
                    question.song
                      .releaseYear !==
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

            </section>

            <section className="game-play-panel">

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
                <div className="game-actions">

                  <button
                    type="button"
                    className="game-advance"
                    onClick={
                      handleAdvance
                    }
                    disabled={
                      listeningStage >=
                      LISTENING_STAGES.length -
                        1
                    }
                  >
                    {listeningStage <
                    LISTENING_STAGES.length -
                      1
                      ? `ADVANCE → ${
                          LISTENING_STAGES[
                            listeningStage +
                              1
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

                  <div className="game-feedback__points">
                    {previewComplete
                      ? 'PREVIEW COMPLETE'
                      : 'PREVIEW CONTINUES'}
                  </div>

                </div>
              )}

            </section>

          </div>

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
                  ? `${timeRemaining.toFixed(
                      1,
                    )}s`
                  : `${Math.ceil(
                      timeRemaining,
                    )}s`}
              </strong>

            </div>

          </div>

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
                      roundConfig.questionCount -
                        1
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