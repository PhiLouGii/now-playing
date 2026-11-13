
import {
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import {
  useEffect,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../config/api'
import './Artists.css'

type FeaturedArtist = {
  id: string
  name: string
  image: string | null
}

function getArtistSlug(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

type ArtistCardProps = {
  artist: FeaturedArtist
  onSelect: (artist: FeaturedArtist) => void
}

function ArtistCard({
  artist,
  onSelect,
}: ArtistCardProps) {
  const [imageError, setImageError] = useState(false)

  const imagePath = `/artists/${getArtistSlug(
    artist.name,
  )}.png`

  return (
    <button
      type="button"
      className={`artists-page__card ${
        imageError
          ? 'artists-page__card--missing'
          : ''
      }`}
      onClick={() => onSelect(artist)}
    >
      <div className="artists-page__image-wrapper">
        {!imageError ? (
          <img
            src={imagePath}
            alt=""
            className="artists-page__image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="artists-page__missing-image">
            <span>ARTWORK</span>
            <strong>NEEDED</strong>
          </div>
        )}
      </div>

      <div className="artists-page__card-footer">
        <span className="artists-page__name">
          {artist.name}
        </span>

        <ArrowRight
          size={15}
          className="artists-page__arrow"
        />
      </div>

      {imageError && (
        <span className="artists-page__missing-label">
          Add {getArtistSlug(artist.name)}.png
        </span>
      )}
    </button>
  )
}

function Artists() {
  const navigate = useNavigate()

  const [artists, setArtists] = useState<FeaturedArtist[]>([])
  const [artistsLoading, setArtistsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    async function loadArtists() {
      try {
        setLoadError(false)

        const response = await fetch(
          `${API_URL}/music/artists`,
        )

        if (!response.ok) {
          throw new Error(
            `Failed to load artists: ${response.status}`,
          )
        }

        const data = await response.json()

        setArtists(data.artists ?? [])
      } catch (error) {
        console.error(
          'Failed to load artists:',
          error,
        )

        setLoadError(true)
      } finally {
        setArtistsLoading(false)
      }
    }

    loadArtists()
  }, [])

  function handleArtistSelect(artist: FeaturedArtist) {
    navigate('/play-by-artist', {
      state: {
        artistId: artist.id,
        artist: artist.name,
      },
    })
  }

  return (
    <div className="artists-page">
      <div className="artists-page__container">
        <header className="artists-page__header">
          <button
            type="button"
            className="artists-page__back"
            onClick={() => navigate('/play')}
          >
            <ArrowLeft size={16} />
            Back to play
          </button>

          <div className="artists-page__heading">
            <p className="label">
              PLAY BY ARTIST
            </p>

            <h1 className="display-lg">
              Every artist.
              <br />
              One place.
            </h1>

            <p className="artists-page__intro">
              Pick an artist and see how well
              you know their music.
            </p>
          </div>

          {!artistsLoading && !loadError && (
            <span className="artists-page__count">
              {artists.length} artists
            </span>
          )}
        </header>

        <main className="artists-page__content">
          {artistsLoading ? (
            <div className="artists-page__grid">
              {Array.from({ length: 12 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="artists-page__card artists-page__card--loading"
                  >
                    <div className="artists-page__image-skeleton" />

                    <div className="artists-page__footer-skeleton">
                      <div className="artists-page__name-skeleton" />
                      <div className="artists-page__arrow-skeleton" />
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : loadError ? (
            <div className="artists-page__state">
              <h2>Something went wrong.</h2>

              <p>
                We couldn&apos;t load the artists
                right now.
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : artists.length === 0 ? (
            <div className="artists-page__state">
              <h2>No artists yet.</h2>

              <p>
                Add artists to the featured
                artist list to see them here.
              </p>
            </div>
          ) : (
            <div className="artists-page__grid">
              {artists.map((artist) => (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  onSelect={handleArtistSelect}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Artists
