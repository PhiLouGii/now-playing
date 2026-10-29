import {
  useEffect,
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


function shuffle<T>(
  array: T[],
): T[] {
  const shuffled = [...array]

  for (
    let i =
      shuffled.length - 1
    ; i > 0
    ; i--
  ) {
    const j =
      Math.floor(
        Math.random() *
          (i + 1),
      )

    ;[
      shuffled[i],
      shuffled[j],
    ] = [
      shuffled[j],
      shuffled[i],
    ]
  }

  return shuffled
}


export default function LoadingScreen({
  facts = [],
  message = 'Loading your game...',
  isComplete = false,
}: LoadingScreenProps) {

  const [
    shuffledFacts,
    setShuffledFacts,
  ] = useState<LoadingFact[]>([])

  const [
    currentFactIndex,
    setCurrentFactIndex,
  ] = useState(0)

  const [
    progress,
    setProgress,
  ] = useState(0)

  /*
   * Shuffle facts whenever the
   * supplied facts change.
   */
  useEffect(() => {
    if (facts.length === 0) {
      setShuffledFacts([])
      return
    }

    setShuffledFacts(
      shuffle(facts),
    )

    setCurrentFactIndex(0)
  }, [facts])

  /*
   * Rotate facts every 10 seconds.
   */
  useEffect(() => {
    if (shuffledFacts.length <= 1) {
      return
    }

    const interval =
      window.setInterval(() => {
        setCurrentFactIndex(
          currentIndex =>
            (currentIndex + 1) %
            shuffledFacts.length,
        )
      }, 10000)

    return () => {
      window.clearInterval(
        interval,
      )
    }
  }, [shuffledFacts])

  /*
   * Loading progress.
   *
   * While the game is loading,
   * progress can reach 90% but
   * never finishes on its own.
   */
  useEffect(() => {
    if (isComplete) {
      setProgress(100)
      return
    }

    const interval =
      window.setInterval(() => {
        setProgress(
          currentProgress => {
            if (
              currentProgress >=
              90
            ) {
              return 90
            }

            return Math.min(
              currentProgress +
                Math.random() * 8,
              90,
            )
          },
        )
      }, 500)

    return () => {
      window.clearInterval(
        interval,
      )
    }
  }, [isComplete])

  const currentFact =
    shuffledFacts[
      currentFactIndex
    ]

  return (
    <main className="loading-screen">
      <div className="loading-screen__content">

        <div className="loading-screen__brand">
          <div className="loading-screen__logo">
            ♪
          </div>

          <h1>
            NOW PLAYING
          </h1>
        </div>

        <div className="loading-screen__loader">

          <div className="loading-screen__spinner">
            <span />
            <span />
            <span />
            <span />
          </div>

          <p className="loading-screen__message">
            {isComplete
              ? 'Ready!'
              : message}
          </p>

          <div className="loading-screen__progress">
            <div
              className="loading-screen__progress-bar"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <span className="loading-screen__percentage">
            {Math.round(progress)}%
          </span>

        </div>

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
                Discover something new
                while your game loads.
              </p>
            )}
          </div>

          {shuffledFacts.length > 1 && (
            <div className="loading-screen__dots">
              {shuffledFacts
                .slice(0, 5)
                .map(
                  (
                    _,
                    index,
                  ) => (
                    <span
                      key={index}
                      className={
                        index ===
                        currentFactIndex %
                          5
                          ? 'active'
                          : ''
                      }
                    />
                  ),
                )}
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