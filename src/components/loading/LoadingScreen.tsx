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

type Collectible = {
  id: number
  image: string
  x: number
  y: number
  velocityX: number
  velocityY: number
  size: number
  rotation: number
}

const EMPTY_FACTS: LoadingFact[] = []

const COLLECTIBLE_IMAGES = [
  '/loading-game/cassette.png',
  '/loading-game/floppy-disk.png',
  '/loading-game/ipod.png',
  '/loading-game/vinyl.png',
  '/loading-game/headphones.png',
  '/loading-game/jukebox.png',
  '/loading-game/cd.png',
]

const COLLECTIBLE_COUNT = 7

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

function createCollectible(id: number): Collectible {
  const angle = Math.random() * Math.PI * 2
  const speed = 0.12 + Math.random() * 0.16

  return {
    id,
    image:
      COLLECTIBLE_IMAGES[
        Math.floor(Math.random() * COLLECTIBLE_IMAGES.length)
      ],
    x: 6 + Math.random() * 88,
    y: 8 + Math.random() * 84,
    velocityX: Math.cos(angle) * speed,
    velocityY: Math.sin(angle) * speed,
    size: 38 + Math.random() * 16,
    rotation: -12 + Math.random() * 24,
  }
}

function createInitialCollectibles(): Collectible[] {
  return Array.from(
    { length: COLLECTIBLE_COUNT },
    (_, index) => createCollectible(index),
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

  const [collectibles, setCollectibles] =
    useState<Collectible[]>(createInitialCollectibles)

  const [collectedCount, setCollectedCount] =
    useState(0)

  const collectiblesRef = useRef<Collectible[]>(collectibles)
  const nextId = useRef(COLLECTIBLE_COUNT)

  /*
   * Shuffle facts whenever supplied facts change.
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
   * Slow-loading warning after 9 seconds.
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
   * Floating collectible movement.
   */
  useEffect(() => {
    if (isComplete) return

    const interval = window.setInterval(() => {
      const nextCollectibles = collectiblesRef.current.map(item => {
        let nextX = item.x + item.velocityX
        let nextY = item.y + item.velocityY

        let nextVelocityX = item.velocityX
        let nextVelocityY = item.velocityY

        // Bounce horizontally.
        if (nextX < 5 || nextX > 95) {
          nextVelocityX *= -1
          nextX = Math.max(5, Math.min(95, nextX))
        }

        // Bounce vertically.
        if (nextY < 7 || nextY > 93) {
          nextVelocityY *= -1
          nextY = Math.max(7, Math.min(93, nextY))
        }

        return {
          ...item,
          x: nextX,
          y: nextY,
          velocityX: nextVelocityX,
          velocityY: nextVelocityY,
        }
      })

      collectiblesRef.current = nextCollectibles
      setCollectibles(nextCollectibles)
    }, 40)

    return () => window.clearInterval(interval)
  }, [isComplete])

  /*
   * Collect an object and spawn a replacement.
   */
  const collectItem = (id: number) => {
    const replacement = createCollectible(nextId.current++)

    const nextCollectibles = collectiblesRef.current.map(item =>
      item.id === id ? replacement : item,
    )

    collectiblesRef.current = nextCollectibles
    setCollectibles(nextCollectibles)

    setCollectedCount(count => count + 1)
  }

  const currentFact = shuffledFacts[currentFactIndex]

  return (
    <main className="loading-screen">

      {!isComplete && (
        <div className="loading-game">

          <div className="loading-game__counter">
            <span>COLLECTED</span>
            <strong>{collectedCount}</strong>
          </div>

          {collectibles.map(item => (
            <button
              key={item.id}
              type="button"
              className="loading-game__collectible"
              onClick={() => collectItem(item.id)}
              aria-label={`Collect ${item.image.split('/').pop()?.replace('.png', '').replace('-', ' ')}`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: `${item.size}px`,
                height: `${item.size}px`,
                transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
              }}
            >
              <img
                src={item.image}
                alt=""
                draggable={false}
              />
            </button>
          ))}

        </div>
      )}

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
          <div className="loading-screen__activity-hint">
            Tap the floating music collectibles while you wait!
          </div>
        )}

        {showSlowWarning && !isComplete && (
          <p className="loading-screen__slow-warning">
            Taking a little longer than expected.
            Hang tight — your music is on its way!
          </p>
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