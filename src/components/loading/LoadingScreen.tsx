import {
  useEffect,
  useRef,
  useState,
} from 'react'

import './LoadingScreen.css'

export type LoadingFact = {
  id?: string
  text?: string
  fact?: string
  category?: string
  relatedArtist?: string
  relatedSong?: string
  relatedAlbum?: string
  relatedGenre?: string
  relatedEra?: string
}

type LoadingScreenProps = {
  facts?: LoadingFact[]
  message?: string
  isComplete?: boolean
}

type FallingNote = {
  id: number
  image: string
  x: number
  y: number
  speed: number
  size: number
}

const EMPTY_FACTS: LoadingFact[] = []

const BASKET_IMAGE = '/basket.png'

const NOTE_IMAGES = [
  '/notes/note-blue.png',
  '/notes/note-lavender.png',
  '/notes/note-pink.png',
  '/notes/note-purple.png',
  '/notes/note-rose.png',
  '/notes/note-lilac.png',
]

const NOTE_SPAWN_HEIGHT = -12
const CATCH_HEIGHT = 82
const BASKET_CATCH_RANGE = 12

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))

    ;[shuffled[i], shuffled[j]] = [
      shuffled[j],
      shuffled[i],
    ]
  }

  return shuffled
}

function createNote(id: number): FallingNote {
  return {
    id,
    image: NOTE_IMAGES[
      Math.floor(Math.random() * NOTE_IMAGES.length)
    ],
    x: 7 + Math.random() * 86,
    y: NOTE_SPAWN_HEIGHT - Math.random() * 35,
    speed: 0.65 + Math.random() * 0.65,
    size: 27 + Math.random() * 17,
  }
}

function createInitialNotes(): FallingNote[] {
  return Array.from(
    { length: 5 },
    (_, index) => ({
      ...createNote(index),
      y: -10 - Math.random() * 100,
    }),
  )
}

export default function LoadingScreen({
  facts = EMPTY_FACTS,
  message = 'Loading your game...',
  isComplete = false,
}: LoadingScreenProps) {
  const [shuffledFacts, setShuffledFacts] =
    useState<LoadingFact[]>([])

  const [currentFactIndex, setCurrentFactIndex] =
    useState(0)

  const [progress, setProgress] = useState(0)

  const [showSlowWarning, setShowSlowWarning] =
    useState(false)

  const [basketPosition, setBasketPosition] =
    useState(50)

  const [caughtCount, setCaughtCount] =
    useState(0)

  const [notes, setNotes] =
    useState<FallingNote[]>(createInitialNotes)

  const notesRef = useRef<FallingNote[]>(notes)
  const basketPositionRef = useRef(50)
  const nextNoteId = useRef(5)

  /*
   * Shuffle facts whenever the
   * supplied facts change.
   */
  useEffect(() => {
    if (facts.length === 0) {
      setShuffledFacts([])
      setCurrentFactIndex(0)
      return
    }

    setShuffledFacts(shuffle(facts))
    setCurrentFactIndex(0)
  }, [facts])

  /*
   * Rotate facts every 10 seconds.
   */
  useEffect(() => {
    if (shuffledFacts.length <= 1) return

    const interval = window.setInterval(() => {
      setCurrentFactIndex(currentIndex =>
        (currentIndex + 1) % shuffledFacts.length,
      )
    }, 10000)

    return () => window.clearInterval(interval)
  }, [shuffledFacts])

  /*
   * Loading progress.
   * Progress stops at 90% until loading completes.
   */
  useEffect(() => {
    if (isComplete) {
      setProgress(100)
      return
    }

    const interval = window.setInterval(() => {
      setProgress(currentProgress => {
        if (currentProgress >= 90) return 90

        return Math.min(
          currentProgress + Math.random() * 8,
          90,
        )
      })
    }, 500)

    return () => window.clearInterval(interval)
  }, [isComplete])

  /*
   * Show a gentle warning if loading
   * takes longer than 9 seconds.
   */
  useEffect(() => {
    if (isComplete) {
      setShowSlowWarning(false)
      return
    }

    const timeout = window.setTimeout(() => {
      setShowSlowWarning(true)
    }, 9000)

    return () => window.clearTimeout(timeout)
  }, [isComplete])

  /*
   * Keep the note animation running
   * while the game is loading.
   */
  useEffect(() => {
    if (isComplete) return

    const interval = window.setInterval(() => {
      let caughtThisTick = 0

      const nextNotes = notesRef.current.map(note => {
        const nextY = note.y + note.speed

        const isAtBasket =
          nextY >= CATCH_HEIGHT &&
          note.y < CATCH_HEIGHT

        const isCaught =
          isAtBasket &&
          Math.abs(
            note.x - basketPositionRef.current,
          ) <= BASKET_CATCH_RANGE

        if (isCaught) {
          caughtThisTick += 1
          return createNote(nextNoteId.current++)
        }

        if (nextY > 105) {
          return createNote(nextNoteId.current++)
        }

        return {
          ...note,
          y: nextY,
        }
      })

      notesRef.current = nextNotes
      setNotes(nextNotes)

      if (caughtThisTick > 0) {
        setCaughtCount(current => current + caughtThisTick)
      }
    }, 40)

    return () => window.clearInterval(interval)
  }, [isComplete])

  /*
   * Move the basket using pointer position.
   */
  const moveBasket = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const bounds = event.currentTarget.getBoundingClientRect()

    const relativePosition =
      ((event.clientX - bounds.left) / bounds.width) * 100

    const nextPosition = Math.max(
      7,
      Math.min(93, relativePosition),
    )

    basketPositionRef.current = nextPosition
    setBasketPosition(nextPosition)
  }

  /*
   * Keyboard controls.
   */
  const handleGameKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight'
    ) {
      return
    }

    event.preventDefault()

    const direction =
      event.key === 'ArrowLeft' ? -6 : 6

    const nextPosition = Math.max(
      7,
      Math.min(
        93,
        basketPositionRef.current + direction,
      ),
    )

    basketPositionRef.current = nextPosition
    setBasketPosition(nextPosition)
  }

  const currentFact = shuffledFacts[currentFactIndex]

  return (
    <main className="loading-screen">
      <div className="loading-screen__content">

        <div className="loading-screen__brand">
          <div className="loading-screen__logo">
            ♪
          </div>

          <h1>NOW PLAYING</h1>
        </div>

        <div className="loading-screen__loader">

          <div className="loading-screen__spinner">
            <span />
            <span />
            <span />
            <span />
          </div>

          <p className="loading-screen__message">
            {isComplete ? 'Ready!' : message}
          </p>

          <div className="loading-screen__progress">
            <div
              className="loading-screen__progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          <span className="loading-screen__percentage">
            {Math.round(progress)}%
          </span>

        </div>

        {!isComplete && (
          <section className="loading-game">

            <div className="loading-game__header">
              <div>
                <span className="loading-game__eyebrow">
                  WHILE YOU WAIT
                </span>

                <h2>Catch the Note</h2>
              </div>

              <div
                className="loading-game__score"
                aria-live="polite"
              >
                <span>CAUGHT</span>
                <strong>{caughtCount}</strong>
              </div>
            </div>

            <div
              className="loading-game__playfield"
              onPointerMove={moveBasket}
              onPointerDown={moveBasket}
              onKeyDown={handleGameKeyDown}
              tabIndex={0}
              role="application"
              aria-label="Catch the falling musical notes. Move the basket with your pointer or use the left and right arrow keys."
            >
              <div className="loading-game__instructions">
                MOVE TO CATCH
              </div>

              {notes.map(note => (
                <img
                  key={note.id}
                  className="loading-game__note"
                  src={note.image}
                  alt=""
                  draggable={false}
                  style={{
                    left: `${note.x}%`,
                    top: `${note.y}%`,
                    width: `${note.size}px`,
                    height: `${note.size}px`,
                  }}
                />
              ))}

              <div
                className="loading-game__basket"
                style={{
                  left: `${basketPosition}%`,
                }}
              >
                <img
                  src={BASKET_IMAGE}
                  alt=""
                  draggable={false}
                />
              </div>
            </div>

            {showSlowWarning && (
              <p className="loading-game__slow-warning">
                Taking a little longer than expected.
                Hang tight — your music is on its way!
              </p>
            )}

          </section>
        )}

        <section className="loading-screen__fact">

          <span className="loading-screen__fact-label">
            DID YOU KNOW?
          </span>

          <div className="loading-screen__fact-content">
            {currentFact ? (
              <>
                <p>
                  {currentFact.text ??
                    currentFact.fact ??
                    'Discover something new while your game loads.'}
                </p>

                {currentFact.relatedArtist && (
                  <span className="loading-screen__fact-context">
                    {currentFact.relatedArtist}
                  </span>
                )}
              </>
            ) : (
              <p>
                Discover something new while your game loads.
              </p>
            )}
          </div>

          {shuffledFacts.length > 1 && (
            <div className="loading-screen__dots">
              {shuffledFacts.slice(0, 5).map((_, index) => (
                <span
                  key={index}
                  className={
                    index === currentFactIndex % 5
                      ? 'active'
                      : ''
                  }
                />
              ))}
            </div>
          )}

        </section>

        <p className="loading-screen__footer">
          Get ready to test your music knowledge.
        </p>

      </div>
    </main>
  )
}