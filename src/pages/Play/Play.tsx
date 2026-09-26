import {
  ArrowRight,
  Disc3,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import './Play.css'


type FeaturedArtist = {
  id: string
  name: string
  image: string | null
}


/*
 * Custom artwork for artists.
 *
 * Add your own images to:
 *
 * public/artists/
 */
const CUSTOM_ARTIST_IMAGES: Record<
  string,
  string
> = {
  'Rihanna':
    '/artists/rihanna.png',

  'Madonna':
    '/artists/madonna.png',

  'Billie Eilish':
    '/artists/billie-eilish.png',

  'Lionel Richie':
    '/artists/lionel-richie.png',

  'The Killers':
    '/artists/the-killers.png',
}


/*
 * ---------------------------------------------------------
 * ERAS
 * ---------------------------------------------------------
 *
 * Each era has its own visual representing how people
 * experienced music during that period.
 *
 * The source images should be 600 x 600px and stored in:
 *
 * public/eras/
 */

const ERAS = [
  {
    label: '60s',
    image: '/eras/60s.png',
    decade: 1960,
  },

  {
    label: '70s',
    image: '/eras/70s.png',
    decade: 1970,
  },

  {
    label: '80s',
    image: '/eras/80s.png',
    decade: 1980,
  },

  {
    label: '90s',
    image: '/eras/90s.png',
    decade: 1990,
  },

  {
    label: '00s',
    image: '/eras/00s.png',
    decade: 2000,
  },

  {
    label: '10s',
    image: '/eras/10s.png',
    decade: 2010,
  },

  {
    label: '20s',
    image: '/eras/20s.png',
    decade: 2020,
  },
]


/*
 * ---------------------------------------------------------
 * GENRES
 * ---------------------------------------------------------
 *
 * Add the corresponding artwork to:
 *
 * public/genres/
 */

const GENRES = [
  {
    label: 'Pop',
    genre: 'pop',
    image: '/genres/pop.png',
  },

  {
    label: 'Hip-Hop',
    genre: 'hip-hop',
    image: '/genres/hip-hop.png',
  },

  {
    label: 'R&B',
    genre: 'rnb',
    image: '/genres/rnb.png',
  },

  {
    label: 'Rock',
    genre: 'rock',
    image: '/genres/rock.png',
  },

  {
    label: 'Latin Pop',
    genre: 'latin',
    image: '/genres/latin.png',
  },

  {
    label: 'K-Pop',
    genre: 'kpop',
    image: '/genres/kpop.png',
  },
  {
    label: 'Country',
    genre: 'country',
    image: '/genres/country.png',
  },
  {
    label: 'Reggae',
    genre: 'regae',
    image: '/genres/reggae.png',
  },
  {
    label: 'Afrobeats',
    genre: 'afrobeats',
    image: '/genres/afrobeats.png',
  },
]


function Play() {
  const navigate =
    useNavigate()

  const [
    artists,
    setArtists,
  ] =
    useState<FeaturedArtist[]>([])

  const [
    artistsLoading,
    setArtistsLoading,
  ] =
    useState(true)


  useEffect(() => {
    async function loadArtists() {
      try {
        const response =
          await fetch(
            '/api/music/artists',
          )

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
        setArtistsLoading(
          false,
        )
      }
    }

    loadArtists()
  }, [])


  function handleArtistSelect(
    artist: FeaturedArtist,
  ) {
    navigate(
      '/play-by-artist',
      {
        state: {
          artistId:
            artist.id,

          artist:
            artist.name,
        },
      },
    )
  }


  function handleEraSelect(
    decade: number,
  ) {
    navigate(
      '/game',
      {
        state: {
          roundConfig: {
            id:
              `decade-${decade}`,

            name:
              `${decade}s`,

            questionCount:
              10,

            questionTypes: [
              'name-the-song',
            ],

            difficulty:
              'medium',

            decade,
          },
        },
      },
    )
  }


  function handleGenreSelect(
    genre: string,
    label: string,
  ) {
    navigate(
      '/game',
      {
        state: {
          roundConfig: {
            id:
              `genre-${genre}`,

            name:
              label,

            questionCount:
              10,

            questionTypes: [
              'name-the-song',
            ],

            difficulty:
              'medium',

            genre,
          },
        },
      },
    )
  }


  function handlePixelCover() {
    navigate(
      '/album-game',
      {
        state: {
          mode:
            'pixel-cover',
        },
      },
    )
  }


  function getArtistImage(
    artist: FeaturedArtist,
  ) {
    return (
      CUSTOM_ARTIST_IMAGES[
        artist.name
      ] ??
      artist.image
    )
  }


  const featuredArtists =
    artists.slice(0, 5)


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


          {/* -------------------------------------------------
              PLAY BY ARTIST
              ------------------------------------------------- */}

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
                  length: 5,
                }).map(
                  (_, index) => (

                    <div
                      key={index}
                      className="artist-card artist-card--loading"
                      aria-hidden="true"
                    >

                      <div className="artist-card__image-skeleton" />

                      <div className="artist-card__name-skeleton" />

                    </div>

                  ),
                )

              ) : (

                featuredArtists.map(
                  artist => {

                    const image =
                      getArtistImage(
                        artist,
                      )

                    return (
                      <button
                        key={
                          artist.id
                        }
                        type="button"
                        className="artist-card"
                        onClick={() =>
                          handleArtistSelect(
                            artist,
                          )
                        }
                      >

                        {image ? (

                          <img
                            src={
                              image
                            }
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
                          size={15}
                          className="artist-card__arrow"
                        />

                      </button>
                    )
                  },
                )

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
                navigate(
                  '/artists',
                )
              }
            >

              View more artists

              <ArrowRight
                size={16}
              />

            </button>

          </section>


          {/* -------------------------------------------------
              PLAY BY ERA
              ------------------------------------------------- */}

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

              {ERAS.map(
                era => (

                  <button
                    key={
                      era.decade
                    }
                    type="button"
                    className="era-card"
                    onClick={() =>
                      handleEraSelect(
                        era.decade,
                      )
                    }
                  >

                    <div className="era-card__image-wrapper">

                      <img
                        src={
                          era.image
                        }
                        alt={`${era.label} music era`}
                        className="era-card__image"
                      />

                    </div>


                    <div className="era-card__content">

                      <div>

                        <span className="era-card__label">
                          {era.label}
                        </span>

                        <span className="era-card__description">
                        </span>

                      </div>

                      <ArrowRight
                        size={15}
                        className="era-card__arrow"
                      />

                    </div>

                  </button>

                ),
              )}

            </div>

          </section>


          {/* -------------------------------------------------
              PLAY BY GENRE
              ------------------------------------------------- */}

          <section className="play-section">

            <div className="play-section__heading">

              <div>

                <p className="play-section__eyebrow">
                  PLAY BY GENRE
                </p>

                <h2>
                  Pick a sound.
                </h2>

                <p>
                  Dive into the music you love.
                </p>

              </div>

            </div>


            <div className="genre-grid">

              {GENRES.map(
                genre => (

                  <button
                    key={
                      genre.genre
                    }
                    type="button"
                    className="genre-card"
                    onClick={() =>
                      handleGenreSelect(
                        genre.genre,
                        genre.label,
                      )
                    }
                  >

                    <div className="genre-card__image-wrapper">

                      <img
                        src={
                          genre.image
                        }
                        alt={`${genre.label} music`}
                        className="genre-card__image"
                      />

                    </div>


                    <div className="genre-card__content">

                      <span className="genre-card__label">
                        {genre.label}
                      </span>

                      <ArrowRight
                        size={15}
                        className="genre-card__arrow"
                      />

                    </div>

                  </button>

                ),
              )}

            </div>

          </section>


          {/* -------------------------------------------------
              MORE WAYS TO PLAY
              ------------------------------------------------- */}

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

                <ArrowRight
                  size={16}
                />

              </button>

            </div>

          </section>


        </main>

      </div>
    </div>
  )
}


export default Play

