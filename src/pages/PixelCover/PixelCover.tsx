import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  LoaderCircle,
  RotateCcw,
  Search,
} from 'lucide-react'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'

import './PixelCover.css'

/* =========================================================
   TYPES
   ========================================================= */

type PixelCoverAlbum = {
  id: string
  title: string
  artist: string
  year: number | null
  coverUrl: string
}

type AlbumResponse = {
  albums: PixelCoverAlbum[]
  requested?: number
  found?: number
}

type RoundResult = {
  album: PixelCoverAlbum
  correct: boolean
  points: number
}

/* =========================================================
   GAME SETTINGS
   ========================================================= */

const REVEAL_STAGES = [
  { label: '144p', blur: 18 },
  { label: '240p', blur: 12 },
  { label: '360p', blur: 7 },
  { label: '720p', blur: 2 },
  { label: '1080p', blur: 0 },
] as const

const STAGE_POINTS = [1000, 800, 600, 400, 200]
const TOTAL_ROUNDS = 10

/* =========================================================
   HELPERS
   ========================================================= */

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function shuffleAlbums(albums: PixelCoverAlbum[]) {
  const shuffled = [...albums]

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

/* =========================================================
   PIXELATED ARTWORK
   ========================================================= */

/* =========================================================
   PROGRESSIVE-QUALITY ALBUM ARTWORK
   ========================================================= */

type PixelatedArtworkProps = {
  album: PixelCoverAlbum
  resolution: (typeof REVEAL_STAGES)[number]
}

function PixelatedArtwork({
  album,
  resolution,
}: PixelatedArtworkProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageLoaded(false)
    setImageFailed(false)
  }, [album.id])

  return (
    <div
      className="pixel-artwork"
      aria-label={`Album cover at ${resolution.label} quality`}
    >
      {!imageFailed ? (
        <img
          key={album.id}
          src={album.coverUrl}
          alt={`Album cover at ${resolution.label} quality`}
          className={[
            'pixel-artwork__image',
            imageLoaded ? 'pixel-artwork__image--loaded' : '',
          ].join(' ')}
          style={{
            filter: `blur(${resolution.blur}px)`,
            transform: resolution.blur > 0 ? 'scale(1.08)' : 'scale(1)',
            opacity: imageLoaded ? 1 : 0,
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageFailed(true)}
          draggable={false}
        />
      ) : (
        <div className="pixel-artwork__fallback">
          <span>Artwork unavailable</span>
        </div>
      )}

      {!imageLoaded && !imageFailed && (
        <div className="pixel-artwork__loading">
          <LoaderCircle size={22} />
        </div>
      )}
    </div>
  )
}

/* =========================================================
   PIXEL COVER GAME
   ========================================================= */

function PixelCover() {
  const navigate = useNavigate()

  const [albums, setAlbums] = useState<PixelCoverAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [roundAlbums, setRoundAlbums] = useState<PixelCoverAlbum[]>([])
  const [roundIndex, setRoundIndex] = useState(0)
  const [revealStage, setRevealStage] = useState(0)

  const [guess, setGuess] = useState('')
  const [score, setScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [roundPoints, setRoundPoints] = useState(0)
  const [roundResults, setRoundResults] = useState<RoundResult[]>([])

  const [answered, setAnswered] = useState(false)
  const [revealedAnswer, setRevealedAnswer] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [gameFinished, setGameFinished] = useState(false)

  const currentAlbum = roundAlbums[roundIndex]

  /* =========================================================
     LOAD ALBUMS
     ========================================================= */

  useEffect(() => {
    let cancelled = false

    async function loadAlbums() {
      try {
        setLoading(true)
        setLoadError('')

        const response = await fetch('/api/pixel-cover/albums')

        if (!response.ok) {
          throw new Error('Unable to load album covers.')
        }

        const data: AlbumResponse = await response.json()

        if (!Array.isArray(data.albums) || data.albums.length === 0) {
          throw new Error('No album covers are available right now.')
        }

        if (cancelled) return

        setAlbums(data.albums)

        const shuffled = shuffleAlbums(data.albums)
        setRoundAlbums(
          shuffled.slice(0, Math.min(TOTAL_ROUNDS, shuffled.length)),
        )
      } catch (error) {
        if (cancelled) return

        setLoadError(
          error instanceof Error
            ? error.message
            : 'Something went wrong while loading album covers.',
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadAlbums()

    return () => {
      cancelled = true
    }
  }, [])

 
  /* =========================================================
     ALBUM TITLE & ARTIST SUGGESTIONS
     ========================================================= */

  
const suggestions = useMemo(() => {
  const query = normalizeText(guess)

  if (!query || answered || revealedAnswer) return []

  return albums
    .filter(album =>
      normalizeText(album.title).includes(query) ||
      normalizeText(album.artist).includes(query),
    )
    .slice(0, 6)
}, [albums, guess, answered, revealedAnswer])



  /* =========================================================
     CURRENT REVEAL STAGE
     ========================================================= */

  const currentResolution = REVEAL_STAGES[revealStage]

const stageLabel = currentResolution.label

  /* =========================================================
     SUBMIT GUESS
     ========================================================= */

  const submitGuess = useCallback(
    (value = guess) => {
      if (!currentAlbum || answered || revealedAnswer) return

      const cleanedGuess = normalizeText(value)

      if (!cleanedGuess) {
        setFeedback('Type an album title first.')
        return
      }

      if (cleanedGuess === normalizeText(currentAlbum.title)) {
        const earnedPoints = STAGE_POINTS[revealStage]

        setScore(previous => previous + earnedPoints)
        setCorrectAnswers(previous => previous + 1)
        setRoundPoints(earnedPoints)

        setRoundResults(previous => [
          ...previous,
          {
            album: currentAlbum,
            correct: true,
            points: earnedPoints,
          },
        ])

        setGuess(currentAlbum.title)
        setAnswered(true)
        setFeedback(`Correct! +${earnedPoints} points`)
        return
      }

      setFeedback('Not quite. Try another title.')
    },
    [guess, currentAlbum, answered, revealedAnswer, revealStage],
  )

  /* =========================================================
     REVEAL COVER / ANSWER
     ========================================================= */

  function handleReveal() {
    if (!currentAlbum || answered || revealedAnswer) return

    if (revealStage < REVEAL_STAGES.length - 1) {
      setRevealStage(previous => previous + 1)
      setFeedback('')
      setGuess('')
      return
    }

    setRevealedAnswer(true)

    setRoundResults(previous => [
      ...previous,
      {
        album: currentAlbum,
        correct: false,
        points: 0,
      },
    ])

    setFeedback(`The album was ${currentAlbum.title}.`)
    setGuess('')
  }

  /* =========================================================
     NEXT ROUND
     ========================================================= */

  function handleNextRound() {
    const nextIndex = roundIndex + 1

    if (nextIndex >= roundAlbums.length) {
      setGameFinished(true)
      return
    }

    setRoundIndex(nextIndex)
    setRevealStage(0)
    setGuess('')
    setRoundPoints(0)
    setAnswered(false)
    setRevealedAnswer(false)
    setFeedback('')
  }

  /* =========================================================
     RESTART GAME
     ========================================================= */

  function handleRestart() {
    const shuffled = shuffleAlbums(albums)

    setRoundAlbums(
      shuffled.slice(0, Math.min(TOTAL_ROUNDS, shuffled.length)),
    )
    setRoundIndex(0)
    setRevealStage(0)
    setGuess('')
    setScore(0)
    setCorrectAnswers(0)
    setRoundPoints(0)
    setRoundResults([])
    setAnswered(false)
    setRevealedAnswer(false)
    setFeedback('')
    setGameFinished(false)
  }

  /* =========================================================
     LOADING / ERROR STATES
     ========================================================= */

  if (loading) {
    return (
      <main className="pixel-cover-page">
        <div className="pixel-cover-status">
          <LoaderCircle className="pixel-cover-spinner" size={30} />
          <h1>Loading Pixel Cover</h1>
          <p>Getting the album artwork ready…</p>
        </div>
      </main>
    )
  }

  if (loadError || albums.length === 0) {
    return (
      <main className="pixel-cover-page">
        <div className="pixel-cover-status">
          <h1>Pixel Cover</h1>
          <p>{loadError || 'No albums are available right now.'}</p>

          <button
            type="button"
            className="pixel-cover-button pixel-cover-button--primary"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>

          <button
            type="button"
            className="pixel-cover-back"
            onClick={() => navigate('/play')}
          >
            <ArrowLeft size={16} />
            Back to Play
          </button>
        </div>
      </main>
    )
  }

  /* =========================================================
     GAME RESULTS
     ========================================================= */

  if (gameFinished) {
    return (
      <main className="pixel-cover-page">
        <div className="pixel-cover-results">
          <p className="pixel-cover-eyebrow">ROUND COMPLETE</p>
          <h1>How well do you know album covers?</h1>

          <div className="pixel-cover-results__score">
            <span>Final score</span>
            <strong>{score.toLocaleString()}</strong>
          </div>

          <div className="pixel-cover-results__stats">
            <div>
              <strong>{correctAnswers}</strong>
              <span>Correct answers</span>
            </div>

            <div>
              <strong>{roundAlbums.length}</strong>
              <span>Albums played</span>
            </div>
          </div>

          <section className="pixel-cover-review">
            <div className="pixel-cover-review__heading">
              <h2>Round review</h2>
              <p>See which albums you recognised and which ones you missed.</p>
            </div>

            <div className="pixel-cover-review__list">
              {roundResults.map((result, index) => (
                <article
                  key={`${result.album.id}-${index}`}
                  className={[
                    'pixel-cover-review__item',
                    result.correct
                      ? 'pixel-cover-review__item--correct'
                      : 'pixel-cover-review__item--missed',
                  ].join(' ')}
                >
                  <img
                    className="pixel-cover-review__image"
                    src={result.album.coverUrl}
                    alt={`Cover of ${result.album.title}`}
                    loading="lazy"
                  />

                  <div className="pixel-cover-review__details">
                    <span className="pixel-cover-review__round">
                      ALBUM {String(index + 1).padStart(2, '0')}
                    </span>

                    <h3>{result.album.title}</h3>

                    <p>
                      {result.album.artist}
                      {result.album.year ? ` · ${result.album.year}` : ''}
                    </p>
                  </div>

                  <div className="pixel-cover-review__outcome">
                    <span>{result.correct ? 'Correct' : 'Missed'}</span>
                    <strong>
                      {result.correct ? `+${result.points}` : '0 pts'}
                    </strong>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="pixel-cover-results__actions">
            <button
              type="button"
              className="pixel-cover-button pixel-cover-button--primary"
              onClick={handleRestart}
            >
              <RotateCcw size={16} />
              Play again
            </button>

            <button
              type="button"
              className="pixel-cover-button pixel-cover-button--secondary"
              onClick={() => navigate('/play')}
            >
              Back to Play
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (!currentAlbum) {
    return null
  }

  const roundNumber = roundIndex + 1
  const canSubmit = guess.trim().length > 0 && !answered && !revealedAnswer
  const canContinue = answered || revealedAnswer

  return (
    <main className="pixel-cover-page">
      <div className="pixel-cover-container">
        {/* HEADER */}

        <header className="pixel-cover-header">
          <button
            type="button"
            className="pixel-cover-back"
            onClick={() => navigate('/play')}
          >
            <ArrowLeft size={17} />
            Back to Play
          </button>

          <div className="pixel-cover-brand">
            <span className="pixel-cover-brand__icon">
              <Eye size={19} />
            </span>
            <span>PIXEL COVER</span>
          </div>

          <div className="pixel-cover-score">
            <span>YOUR SCORE</span>
            <strong>{score.toLocaleString()}</strong>
          </div>
        </header>

        {/* INTRO */}

        <section className="pixel-cover-intro">
          <p className="pixel-cover-eyebrow">ALBUM ART CHALLENGE</p>
          <h1>Recognise the cover.</h1>
          <p>
            The less you reveal, the more you score.
            How quickly can you name the album?
          </p>
        </section>

        {/* PROGRESS */}

        <section className="pixel-cover-progress">
          <div className="pixel-cover-progress__labels">
            <span>
              Album {roundNumber} of {roundAlbums.length}
            </span>
            <span>{correctAnswers} correct</span>
          </div>

          <div
            className="pixel-cover-progress__track"
            role="progressbar"
            aria-valuenow={roundNumber}
            aria-valuemin={1}
            aria-valuemax={roundAlbums.length}
          >
            <div
              className="pixel-cover-progress__fill"
              style={{
                width: `${(roundNumber / roundAlbums.length) * 100}%`,
              }}
            />
          </div>
        </section>

        {/* GAME AREA */}

        <section className="pixel-cover-game">
          <div className="pixel-cover-art-column">
            <div className="pixel-cover-art-heading">
              <span>ALBUM ARTWORK</span>
              <span className="pixel-cover-stage">{stageLabel}</span>
            </div>

            <PixelatedArtwork
              album={currentAlbum}
              resolution={currentResolution}
            />

            <div className="pixel-cover-stage-list">
  {REVEAL_STAGES.map((stage, index) => (
    <div
      key={stage.label}
      className={[
        'pixel-cover-stage-item',
        index <= revealStage
          ? 'pixel-cover-stage-item--active'
          : '',
        index === revealStage
          ? 'pixel-cover-stage-item--current'
          : '',
      ].join(' ')}
    >
      <span className="pixel-cover-stage-item__dot" />
      <span>{stage.label}</span>
    </div>
  ))}
</div>
          </div>

          <div className="pixel-cover-answer-column">
            <div className="pixel-cover-question">
              <span className="pixel-cover-question__number">
                ROUND {String(roundNumber).padStart(2, '0')}
              </span>
              <h2>Which album is this?</h2>
              <p>Enter the album title below.</p>
            </div>

            <form
              className="pixel-cover-form"
              onSubmit={event => {
                event.preventDefault()
                submitGuess()
              }}
            >
              <label
                className="pixel-cover-input-label"
                htmlFor="pixel-cover-guess"
              >
                ALBUM TITLE
              </label>

              <div className="pixel-cover-input-wrapper">
                <Search size={18} />

                <input
                  id="pixel-cover-guess"
                  type="text"
                  value={guess}
                  onChange={event => {
                    setGuess(event.target.value)
                    setFeedback('')
                  }}
                  placeholder="Start typing an album…"
                  autoComplete="off"
                  disabled={answered || revealedAnswer}
                />
              </div>

              {suggestions.length > 0 && (
                <div
                  className="pixel-cover-suggestions"
                  role="listbox"
                  aria-label="Album suggestions"
                >
                  {suggestions.map(album => (
                    <button
                      key={album.id}
                      type="button"
                      className="pixel-cover-suggestion"
                      onClick={() => {
                        setGuess(album.title)
                        submitGuess(album.title)
                      }}
                      role="option"
                      aria-selected={false}
                    >
                      <span className="pixel-cover-suggestion__title">
                        {album.title}
                      </span>
                      <span className="pixel-cover-suggestion__artist">
                        {album.artist}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className="pixel-cover-button pixel-cover-button--primary pixel-cover-submit"
                disabled={!canSubmit}
              >
                <Check size={17} />
                Guess album
              </button>
            </form>

            {feedback && (
              <p
                className={[
                  'pixel-cover-feedback',
                  answered ? 'pixel-cover-feedback--correct' : '',
                  !answered &&
                  !revealedAnswer &&
                  feedback.startsWith('Not quite')
                    ? 'pixel-cover-feedback--incorrect'
                    : '',
                ].join(' ')}
                role="status"
              >
                {feedback}
              </p>
            )}

            {(answered || revealedAnswer) && (
              <div className="pixel-cover-answer-reveal">
                <div className="pixel-cover-answer-reveal__check">
                  <Check size={18} />
                </div>

                <div>
                  <span className="pixel-cover-answer-reveal__label">
                    {answered ? 'YOU GOT IT' : 'THE ANSWER'}
                  </span>
                  <h3>{currentAlbum.title}</h3>
                  <p>
                    {currentAlbum.artist}
                    {currentAlbum.year ? ` · ${currentAlbum.year}` : ''}
                  </p>
                </div>
              </div>
            )}

            {answered && (
              <div className="pixel-cover-earned">
                <span>POINTS EARNED</span>
                <strong>+{roundPoints}</strong>
              </div>
            )}

            <div className="pixel-cover-controls">
              {!canContinue ? (
                <button
                  type="button"
                  className="pixel-cover-button pixel-cover-button--secondary"
                  onClick={handleReveal}
                >
                  <Eye size={17} />
                  {revealStage === REVEAL_STAGES.length - 1
                    ? 'Reveal answer'
                    : 'Reveal more'}
                </button>
              ) : (
                <button
                  type="button"
                  className="pixel-cover-button pixel-cover-button--primary"
                  onClick={handleNextRound}
                >
                  {roundNumber >= roundAlbums.length
                    ? 'See results'
                    : 'Next album'}
                  <ArrowRight size={17} />
                </button>
              )}
            </div>

            <p className="pixel-cover-hint">
              {answered
                ? 'Nice one. Ready for the next cover?'
                : revealedAnswer
                  ? 'Keep going — there are more albums to identify.'
                  : 'Stuck? Reveal another stage, but remember: fewer reveals mean more points.'}
            </p>
          </div>
        </section>

        {/* SCORING GUIDE */}

        <footer className="pixel-cover-scoring">
  <p className="pixel-cover-scoring__title">
    HOW SCORING WORKS
  </p>

  <div className="pixel-cover-scoring__items">
    {REVEAL_STAGES.map((stage, index) => (
      <div key={stage.label}>
        <span>{stage.label}</span>
        <strong>
          {STAGE_POINTS[index].toLocaleString()} pts
        </strong>
      </div>
    ))}
  </div>
</footer>
      </div>
    </main>
  )
}

export default PixelCover
