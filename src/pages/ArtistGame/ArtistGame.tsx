import {
useEffect,
useRef,
useState,
} from 'react'
import {
ArrowRight,
Check,
Pause,
Play,
RotateCcw,
Trophy,
X,
Volume2,
} from 'lucide-react'
import {
useLocation,
useNavigate,
} from 'react-router-dom'

import {
generateQuestion,
} from '../../services/gameService'

import {
submitScore,
} from '../../services/scoreService'

import {
calculateFinalPoints,
} from '../../lib/gameScoring'

import type {
Question,
} from '../../types/game'

import './ArtistGame.css'

const ROUND_LENGTH = 10
const QUESTION_TIME = 10

type AnswerStatus =
| 'idle'
| 'correct'
| 'incorrect'
| 'timeout'

type ArtistGameLocationState = {
artist?: string
}

type ArtistRecognitionResult = {
questionNumber: number
title: string
artist: string
album: string
artworkUrl: string
recognitionTime: number
correct: boolean
points: number
}

function ArtistGame() {
const navigate = useNavigate()
const location = useLocation()

const selectedArtist =
(
location.state as
| ArtistGameLocationState
| null
| undefined
)?.artist

const audioRef =
useRef<HTMLAudioElement | null>(null)

const [questions, setQuestions] =
useState<Question[]>([])

const [currentQuestion, setCurrentQuestion] =
useState(0)

const [loading, setLoading] =
useState(true)

const [loadingNext, setLoadingNext] =
useState(false)

const [selectedAnswer, setSelectedAnswer] =
useState<string | null>(null)

const [answerStatus, setAnswerStatus] =
useState<AnswerStatus>('idle')

const [timeRemaining, setTimeRemaining] =
useState(QUESTION_TIME)

const [isPlaying, setIsPlaying] =
useState(false)

const [score, setScore] =
useState(0)

const [streak, setStreak] =
useState(0)

const [bestStreak, setBestStreak] =
useState(0)

const [
recognitionResults,
setRecognitionResults,
] = useState<ArtistRecognitionResult[]>([])

const [isGameComplete, setIsGameComplete] =
useState(false)

const scoreSubmitted =
useRef(false)

const questionStartedAt =
useRef<number>(Date.now())

const currentQuestionRef =
useRef(0)

const questionsRef =
useRef<Question[]>([])

const recognitionResultsRef =
useRef<ArtistRecognitionResult[]>([])

const streakRef =
useRef(0)

const scoreRef =
useRef(0)

const isGameCompleteRef =
useRef(false)

const loadQuestion = async (
excludedIds: string[],
) => {
return generateQuestion(
'name-the-artist',
'medium',
undefined,
excludedIds,
undefined,
selectedArtist,
)
}

const preloadQuestions = async (
firstQuestion: Question,
) => {
const generated: Question[] = [
firstQuestion,
]


const excludedIds = [
  firstQuestion.song.id,
]

while (
  generated.length <
  ROUND_LENGTH
) {
  try {
    const nextQuestion =
      await loadQuestion(
        excludedIds,
      )

    if (
      generated.some(
        (question) =>
          question.song.id ===
          nextQuestion.song.id,
      )
    ) {
      continue
    }

    generated.push(
      nextQuestion,
    )

    excludedIds.push(
      nextQuestion.song.id,
    )
  } catch {
    break
  }
}

return generated


}

useEffect(() => {
let cancelled = false


async function startGame() {
  try {
    setLoading(true)

    const firstQuestion =
      await loadQuestion([])

    if (cancelled) {
      return
    }

    const generatedQuestions =
      await preloadQuestions(
        firstQuestion,
      )

    if (cancelled) {
      return
    }

    setQuestions(
      generatedQuestions,
    )

    questionsRef.current =
      generatedQuestions

    setCurrentQuestion(0)
    currentQuestionRef.current = 0

    questionStartedAt.current =
      Date.now()

    setTimeRemaining(
      QUESTION_TIME,
    )

    setLoading(false)
  } catch (error) {
    console.error(
      'Failed to start artist game:',
      error,
    )

    if (!cancelled) {
      setLoading(false)
    }
  }
}

void startGame()

return () => {
  cancelled = true
}


}, [selectedArtist])

const question =
questions[currentQuestion]

useEffect(() => {
if (!question) {
return
}


setSelectedAnswer(null)
setAnswerStatus('idle')
setTimeRemaining(
  QUESTION_TIME,
)
setIsPlaying(false)

questionStartedAt.current =
  Date.now()

if (audioRef.current) {
  audioRef.current.pause()
  audioRef.current.currentTime = 0
}


}, [question])

useEffect(() => {
if (
!question ||
answerStatus !== 'idle' ||
loading ||
isGameComplete
) {
return
}


const timer = window.setInterval(() => {
  setTimeRemaining(
    (previous) => {
      if (previous <= 0.1) {
        window.clearInterval(timer)
        handleTimeUp()
        return 0
      }

      return Number(
        (
          previous - 0.1
        ).toFixed(1),
      )
    },
  )
}, 100)

return () => {
  window.clearInterval(timer)
}


}, [
question,
answerStatus,
loading,
isGameComplete,
])

const pauseAudio = () => {
if (!audioRef.current) {
return
}


audioRef.current.pause()
setIsPlaying(false)

}

const calculateRecognitionTime =
() => {
const elapsed =
(
Date.now() -
questionStartedAt.current
) / 1000


  return Math.min(
    QUESTION_TIME,
    Math.max(
      0.1,
      Number(
        elapsed.toFixed(1),
      ),
    ),
  )
}


const handleTimeUp = () => {
if (
answerStatus !== 'idle' ||
!question
) {
return
}


pauseAudio()

const recognitionTime =
  QUESTION_TIME

const nextStreak = 0

setSelectedAnswer(null)
setAnswerStatus('timeout')
setStreak(nextStreak)

streakRef.current =
  nextStreak

const result: ArtistRecognitionResult =
  {
    questionNumber:
      currentQuestion + 1,
    title:
      question.song.title,
    artist:
      question.song.artist,
    album:
      question.song.album,
    artworkUrl:
      question.song.artworkUrl,
    recognitionTime,
    correct: false,
    points: 0,
  }

const updatedResults = [
  ...recognitionResultsRef.current,
  result,
]

recognitionResultsRef.current =
  updatedResults

setRecognitionResults(
  updatedResults,
)


}

const handleAnswer = (
answer: string,
) => {
if (
answerStatus !== 'idle' ||
!question
) {
return
}


pauseAudio()

const recognitionTime =
  calculateRecognitionTime()

const correct =
  answer ===
  question.correctAnswer

const nextStreak = correct
  ? streakRef.current + 1
  : 0

const points = correct
  ? calculateFinalPoints(
      recognitionTime,
      nextStreak,
    )
  : 0

const nextScore =
  scoreRef.current + points

const nextBestStreak =
  Math.max(
    bestStreak,
    nextStreak,
  )

setSelectedAnswer(answer)
setAnswerStatus(
  correct
    ? 'correct'
    : 'incorrect',
)

setScore(nextScore)
scoreRef.current =
  nextScore

setStreak(nextStreak)
streakRef.current =
  nextStreak

setBestStreak(
  nextBestStreak,
)

const result: ArtistRecognitionResult =
  {
    questionNumber:
      currentQuestion + 1,
    title:
      question.song.title,
    artist:
      question.song.artist,
    album:
      question.song.album,
    artworkUrl:
      question.song.artworkUrl,
    recognitionTime,
    correct,
    points,
  }

const updatedResults = [
  ...recognitionResultsRef.current,
  result,
]

recognitionResultsRef.current =
  updatedResults

setRecognitionResults(
  updatedResults,
)


}

const finishGame = () => {
if (
isGameCompleteRef.current
) {
return
}


isGameCompleteRef.current =
  true

setIsGameComplete(true)

pauseAudio()

if (
  scoreSubmitted.current
) {
  return
}

scoreSubmitted.current =
  true

const results =
  recognitionResultsRef.current

const correctAnswers =
  results.filter(
    (result) =>
      result.correct,
  ).length

const totalListeningTime =
  results.reduce(
    (total, result) =>
      total +
      result.recognitionTime,
    0,
  )

const accuracy =
  results.length > 0
    ? Math.round(
        (
          correctAnswers /
          results.length
        ) *
          100,
      )
    : 0

void submitScore({
  gameMode:
    'name-the-artist',
  score:
    scoreRef.current,
  accuracy,
  bestStreak,
  questions:
    ROUND_LENGTH,
  correctAnswers,
  totalListeningTime,
}).catch((error) => {
  console.error(
    'Failed to submit artist game score:',
    error,
  )
})


}

const handleNext = async () => {
if (
loadingNext ||
!question
) {
return
}


if (
  currentQuestion >=
  ROUND_LENGTH - 1
) {
  finishGame()
  return
}

const nextIndex =
  currentQuestion + 1

if (
  !questions[nextIndex]
) {
  setLoadingNext(true)

  try {
    const excludedIds =
      questions.map(
        (item) =>
          item.song.id,
      )

    const nextQuestion =
      await loadQuestion(
        excludedIds,
      )

    const updatedQuestions = [
      ...questions,
      nextQuestion,
    ]

    setQuestions(
      updatedQuestions,
    )

    questionsRef.current =
      updatedQuestions
  } catch (error) {
    console.error(
      'Failed to load next artist question:',
      error,
    )

    setLoadingNext(false)
    return
  }

  setLoadingNext(false)
}

setCurrentQuestion(
  nextIndex,
)

currentQuestionRef.current =
  nextIndex


}

const togglePlayback = async () => {
if (!audioRef.current) {
return
}


if (isPlaying) {
  pauseAudio()
  return
}

try {
  await audioRef.current.play()
  setIsPlaying(true)
} catch (error) {
  console.error(
    'Failed to play audio:',
    error,
  )
}


}

const handleAudioEnded = () => {
setIsPlaying(false)
}

const handlePlayAgain = () => {
window.location.reload()
}

const handleBack = () => {
navigate('/play')
}

if (loading) {
return ( <div className="artist-game"> <div className="artist-game__loading"> <div className="artist-game__loading-spinner" /> <p>Loading game...</p> </div> </div>
)
}

if (
isGameComplete ||
currentQuestion >=
ROUND_LENGTH
) {
const correctAnswers =
recognitionResults.filter(
(result) =>
result.correct,
).length


const accuracy =
  recognitionResults.length >
  0
    ? Math.round(
        (
          correctAnswers /
          recognitionResults.length
        ) *
          100,
      )
    : 0

const fastestRecognition =
  recognitionResults.length >
  0
    ? Math.min(
        ...recognitionResults.map(
          (result) =>
            result.recognitionTime,
        ),
      )
    : 0

return (
  <div className="artist-game">
    <div className="artist-game__results">
      <div className="artist-game__results-icon">
        <Trophy size={32} />
      </div>

      <span className="artist-game__eyebrow">
        ROUND COMPLETE
      </span>

      <h1>
        {selectedArtist
          ? selectedArtist
          : 'Guess the Artist'}
      </h1>

      <div className="artist-game__score">
        {score}
      </div>

      <span className="artist-game__score-label">
        POINTS
      </span>

      <div className="artist-game__stats">
        <div className="artist-game__stat">
          <strong>
            {correctAnswers}
          </strong>
          <span>
            Artists recognized
          </span>
        </div>

        <div className="artist-game__stat">
          <strong>
            {accuracy}%
          </strong>
          <span>
            Accuracy
          </span>
        </div>

        <div className="artist-game__stat">
          <strong>
            {bestStreak}
          </strong>
          <span>
            Best streak
          </span>
        </div>

        <div className="artist-game__stat">
          <strong>
            {fastestRecognition.toFixed(
              1,
            )}
            s
          </strong>
          <span>
            Fastest recognition
          </span>
        </div>
      </div>

      <div className="artist-game__breakdown">
        <div className="artist-game__breakdown-header">
          <span>ROUND BREAKDOWN</span>
          <span>
            {recognitionResults.length}/
            {ROUND_LENGTH}
          </span>
        </div>

        {recognitionResults.map(
          (result) => (
            <div
              className={`artist-game__result-row ${
                result.correct
                  ? 'artist-game__result-row--correct'
                  : 'artist-game__result-row--incorrect'
              }`}
              key={`${result.questionNumber}-${result.title}`}
            >
              <div className="artist-game__result-number">
                {result.questionNumber}
              </div>

              <div className="artist-game__result-info">
                <strong>
                  {result.artist}
                </strong>
                <span>
                  {result.title}
                </span>
              </div>

              <span className="artist-game__result-time">
                {result.recognitionTime.toFixed(
                  1,
                )}
                s
              </span>

              <span className="artist-game__result-points">
                {result.correct
                  ? `+${result.points}`
                  : '0'}
              </span>

              {result.correct ? (
                <Check
                  size={18}
                />
              ) : (
                <X
                  size={18}
                />
              )}
            </div>
          ),
        )}
      </div>

      <div className="artist-game__results-actions">
        <button
          className="artist-game__play"
          onClick={
            handlePlayAgain
          }
        >
          <RotateCcw
            size={18}
          />
          PLAY AGAIN
        </button>

        <button
          className="artist-game__next"
          onClick={handleBack}
        >
          BACK TO PLAY
          <ArrowRight
            size={18}
          />
        </button>
      </div>
    </div>
  </div>
)


}

if (!question) {
return null
}

const progress =
((QUESTION_TIME -
timeRemaining) /
QUESTION_TIME) *
100

const answered =
answerStatus !== 'idle'

return ( <div className="artist-game"> <div className="artist-game__container"> <header className="artist-game__header"> <div> <span className="artist-game__eyebrow">
QUICK MODE </span>

```
        <h1>
          {selectedArtist
            ? `Guess ${selectedArtist}`
            : 'Guess the Artist'}
        </h1>
      </div>

      <div className="artist-game__round">
        <span>ROUND</span>
        <strong>
          {currentQuestion + 1}
          <small>
            /{ROUND_LENGTH}
          </small>
        </strong>
      </div>
    </header>

    <main className="artist-game__board">
      <section className="artist-game__question">
        <div className="artist-game__question-heading">
          <span className="artist-game__eyebrow">
            {answered
              ? 'SONG REVEALED'
              : 'WHO IS THIS?'}
          </span>

          <h2>
            {answered
              ? question.song.title
              : 'Who performs this song?'}
          </h2>
        </div>

        {answered && (
          <div className="artist-game__artwork">
            {question.song
              .artworkUrl ? (
              <img
                src={
                  question.song
                    .artworkUrl
                }
                alt={`${question.song.title} artwork`}
              />
            ) : (
              <div className="artist-game__artwork-placeholder">
                <Volume2 />
              </div>
            )}
          </div>
        )}

        <div className="artist-game__audio-card">
          <audio
            ref={audioRef}
            src={
              question.song
                .audioUrl
            }
            onEnded={
              handleAudioEnded
            }
          />

          <button
            className="artist-game__play-button"
            onClick={
              togglePlayback
            }
            aria-label={
              isPlaying
                ? 'Pause'
                : 'Play'
            }
          >
            {isPlaying ? (
              <Pause size={22} />
            ) : (
              <Play size={22} />
            )}
          </button>

          <div className="artist-game__audio-content">
            <div className="artist-game__waveform">
              {Array.from(
                { length: 32 },
                (_, index) => (
                  <span
                    key={index}
                    style={{
                      height: `${
                        20 +
                        ((index * 17) %
                          45)
                      }%`,
                    }}
                  />
                ),
              )}
            </div>

            <div className="artist-game__progress">
              <span
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          <span className="artist-game__timer">
            {timeRemaining.toFixed(
              1,
            )}
            s
          </span>
        </div>

        <p className="artist-game__hint">
          Listen closely. You only get
          {` ${QUESTION_TIME}`} seconds.
        </p>
      </section>

      <section className="artist-game__answers">
        <div className="artist-game__answers-header">
          <span className="artist-game__eyebrow">
            YOUR ANSWER
          </span>

          <span>
            {streak > 0
              ? `${streak} STREAK`
              : 'NO STREAK'}
          </span>
        </div>

        <div className="artist-game__answer-grid">
          {question.answers.map(
            (answer) => {
              const isSelected =
                selectedAnswer ===
                answer

              const isCorrect =
                answer ===
                question.correctAnswer

              let className =
                'artist-game__answer'

              if (
                answered &&
                isCorrect
              ) {
                className +=
                  ' artist-game__answer--correct'
              }

              if (
                answered &&
                isSelected &&
                !isCorrect
              ) {
                className +=
                  ' artist-game__answer--incorrect'
              }

              return (
                <button
                  key={answer}
                  className={
                    className
                  }
                  onClick={() =>
                    handleAnswer(
                      answer,
                    )
                  }
                  disabled={
                    answered
                  }
                >
                  <span>
                    {answer}
                  </span>

                  {answered &&
                    isCorrect && (
                      <Check
                        size={20}
                      />
                    )}

                  {answered &&
                    isSelected &&
                    !isCorrect && (
                      <X
                        size={20}
                      />
                    )}
                </button>
              )
            },
          )}
        </div>

        {answered && (
          <div
            className={`artist-game__feedback artist-game__feedback--${answerStatus}`}
          >
            <div>
              {answerStatus ===
              'correct' ? (
                <Check
                  size={20}
                />
              ) : (
                <X size={20} />
              )}

              <div>
                <strong>
                  {answerStatus ===
                  'correct'
                    ? 'Correct!'
                    : answerStatus ===
                        'timeout'
                      ? "Time's up!"
                      : 'Not quite!'}
                </strong>

                <span>
                  {question.song.artist}
                </span>
              </div>
            </div>

            {answerStatus ===
              'correct' && (
              <strong>
                +
                {
                  recognitionResults[
                    recognitionResults.length -
                      1
                  ]?.points
                }
              </strong>
            )}
          </div>
        )}

        {answered && (
          <button
            className="artist-game__next"
            onClick={
              handleNext
            }
            disabled={
              loadingNext
            }
          >
            {loadingNext
              ? 'LOADING...'
              : currentQuestion >=
                  ROUND_LENGTH - 1
                ? 'SEE RESULTS'
                : 'NEXT SONG'}
            <ArrowRight
              size={18}
            />
          </button>
        )}
      </section>
    </main>
  </div>
</div>


)
}

export default ArtistGame
