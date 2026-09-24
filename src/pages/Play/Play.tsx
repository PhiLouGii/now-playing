import {
  ArrowRight,
  CalendarDays,
  Disc3,
} from 'lucide-react'
import {
  useEffect,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import './Play.css'

type FeaturedArtist = {
  id: string
  name: string
  image: string | null
}

const ERAS = [
  { label: '60s', decade: 1960 },
  { label: '70s', decade: 1970 },
  { label: '80s', decade: 1980 },
  { label: '90s', decade: 1990 },
  { label: '00s', decade: 2000 },
  { label: '10s', decade: 2010 },
  { label: '20s', decade: 2020 },
]

function Play() {
  const navigate = useNavigate()

  const [artists, setArtists] =
    useState<FeaturedArtist[]>([])

  const [artistsLoading, setArtistsLoading] =
    useState(true)

  useEffect(() => {
    async function loadArtists() {
      try {
        const response =
          await fetch('/api/music/artists')

        if (!response.ok) {
          throw new Error(
            'Failed to load artists',
          )
        }

        const data =
          await response.json()

        setArtists(
          data.artists ?? [],
        )
      } catch (error) {
        console.error(
          'Failed to load featured artists:',
          error,
        )
      } finally {
        setArtistsLoading(false)
      }
    }

    loadArtists()
  }, [])

  function handleArtistSelect(
    artist: FeaturedArtist,
  ) {
    navigate('/play-by-artist', {
      state: {
        artistId: artist.id,
        artist: artist.name,
      },
    })
  }

  function handleEraSelect(
    decade: number,
  ) {
    navigate('/game', {
      state: {
        roundConfig: {
          id: `decade-${decade}`,
          name: `${decade}s`,
          questionCount: 10,
          questionTypes: [
            'name-the-song',
          ],
          difficulty: 'medium',
          decade,
        },
      },
    })
  }

  function handlePixelCover() {
    navigate('/album-game', {
      state: {
        mode: 'pixel-cover',
      },
    })
  }

  function handleDailyChallenge() {
    navigate('/daily-challenge')
  }

  return (
    <div className="play-page">
      <div className="play-page__container">
        <header className="play-page__header">
          <p className="label">
            PLAY
          </p>

          <h1 className="display-lg">
            Choose your music.
          </h1>

          <p className="play-page__intro">
            Pick an artist, travel through a
            decade, or try something a little
            different.
          </p>
        </header>

        <main className="play-page__content">
          <section className="play-section play-section--featured">
            <div className="play-section__heading">
              <div>
                <p className="play-section__eyebrow">
                  FEATURED
                </p>

                <h2>
                  Today&apos;s Challenge
                </h2>
              </div>

              <CalendarDays
                size={22}
                strokeWidth={1.8}
              />
            </div>

            <button
              type="button"
              className="daily-card"
              onClick={
                handleDailyChallenge
              }
            >
              <div className="daily-card__content">
                <span className="daily-card__label">
                  DAILY CHALLENGE
                </span>

                <h3>
                  One challenge.
                  <br />
                  One score.
                </h3>

                <p>
                  Ten songs. One chance to
                  see how well you know
                  today&apos;s music.
                </p>
              </div>

              <span className="daily-card__action">
                Play today
                <ArrowRight size={17} />
              </span>
            </button>
          </section>

          <section className="play-section">
            <div className="play-section__heading">
              <div>
                <p className="play-section__eyebrow">
                  PLAY BY ARTIST
                </p>

                <h2>
                  Pick an artist.
                </h2>

                <p>
                  Name their songs and see how
                  well you know their music.
                </p>
              </div>
            </div>

            <div className="artist-grid">
              {artistsLoading ? (
                Array.from({
                  length: 10,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="artist-card artist-card--loading"
                    aria-hidden="true"
                  >
                    <div className="artist-card__image-skeleton" />

                    <div className="artist-card__name-skeleton" />
                  </div>
                ))
              ) : (
                artists.map((artist) => (
                  <button
                    key={artist.id}
                    type="button"
                    className="artist-card"
                    onClick={() =>
                      handleArtistSelect(
                        artist,
                      )
                    }
                  >
                    {artist.image ? (
                      <img
                        src={artist.image}
                        alt=""
                        className="artist-card__image"
                      />
                    ) : (
                      <div className="artist-card__image artist-card__image--fallback">
                        {artist.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <span className="artist-card__name">
                      {artist.name}
                    </span>

                    <ArrowRight
                      size={16}
                      className="artist-card__arrow"
                    />
                  </button>
                ))
              )}
            </div>

            {!artistsLoading &&
              artists.length === 0 && (
                <p className="artist-grid__empty">
                  Unable to load artists right now.
                  Please try again later.
                </p>
              )}

            <button
              type="button"
              className="section-link"
              onClick={() =>
                navigate('/play-by-artist')
              }
            >
              View more artists
              <ArrowRight size={16} />
            </button>
          </section>

          <section className="play-section">
            <div className="play-section__heading">
              <div>
                <p className="play-section__eyebrow">
                  PLAY BY ERA
                </p>

                <h2>
                  Pick a decade.
                </h2>

                <p>
                  Go back through the music that
                  defined each era.
                </p>
              </div>
            </div>

            <div className="era-grid">
              {ERAS.map((era) => (
                <button
                  key={era.decade}
                  type="button"
                  className="era-card"
                  onClick={() =>
                    handleEraSelect(
                      era.decade,
                    )
                  }
                >
                  <span>
                    {era.label}
                  </span>

                  <ArrowRight
                    size={15}
                    className="era-card__arrow"
                  />
                </button>
              ))}
            </div>
          </section>

          <section className="play-section play-section--pixel">
            <div className="pixel-card">
              <div className="pixel-card__icon">
                <Disc3
                  size={24}
                  strokeWidth={1.7}
                />
              </div>

              <div className="pixel-card__content">
                <p className="play-section__eyebrow">
                  MORE WAYS TO PLAY
                </p>

                <h2>
                  Pixel Cover
                </h2>

                <p>
                  How little of an album cover
                  do you need to recognize it?
                </p>
              </div>

              <button
                type="button"
                className="pixel-card__button"
                onClick={
                  handlePixelCover
                }
              >
                Play
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default Play

