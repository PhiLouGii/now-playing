import {
  Search,
  ArrowUpRight,
} from 'lucide-react'
import {
  useEffect,
  useState,
} from 'react'

import './Explore.css'

import type { Song } from '../../types/game'
import {
  discoverSongs,
  searchSongs,
} from '../../services/songService'

const genres = [
  'Pop',
  'Hip-Hop',
  'R&B',
  'Afrobeats',
  'Amapiano',
  'Indie',
  'Rock',
  'Dancehall',
  'K-Pop',
  'House',
]

const decades = [
  '70s',
  '80s',
  '90s',
  '2000s',
  '2010s',
  '2020s',
]

function Explore() {
  const [query, setQuery] =
    useState('')

  const [songs, setSongs] =
    useState<Song[]>([])

  const [loading, setLoading] =
    useState(true)

  const [searching, setSearching] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    async function loadDiscovery() {
      try {
        setLoading(true)
        setError(null)

        const tracks =
          await discoverSongs(20)

        setSongs(tracks)
      } catch (err) {
        console.error(
          'Failed to load discovery music:',
          err,
        )

        setError(
          'Could not load music right now.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadDiscovery()
  }, [])

  async function handleSearch(
    event: React.FormEvent,
  ) {
    event.preventDefault()

    const normalizedQuery =
      query.trim()

    if (!normalizedQuery) {
      return
    }

    try {
      setSearching(true)
      setError(null)

      const results =
        await searchSongs(
          normalizedQuery,
          20,
        )

      setSongs(results)
    } catch (err) {
      console.error(
        'Music search failed:',
        err,
      )

      setError(
        'Could not search music right now.',
      )
    } finally {
      setSearching(false)
    }
  }

  function handleClearSearch() {
    setQuery('')
  }

  const isSearchResult =
    query.trim().length > 0

  return (
    <main className="explore">

      <section className="explore__hero">
        <div className="explore__hero-content">
          <p className="label">
            EXPLORE
          </p>

          <h1 className="display-lg">
            Find your sound.
          </h1>

          <p className="explore__intro">
            Search for a song, artist, or album,
            or discover something new.
          </p>

          <form
            className="explore__search"
            onSubmit={handleSearch}
          >
            <Search
              size={19}
              className="explore__search-icon"
            />

            <input
              type="text"
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="Search songs, artists, albums..."
              aria-label="Search music"
            />

            {query && (
              <button
                type="button"
                className="explore__clear"
                onClick={
                  handleClearSearch
                }
              >
                CLEAR
              </button>
            )}

            <button
              type="submit"
              className="explore__search-button"
              disabled={
                searching ||
                !query.trim()
              }
            >
              {searching
                ? 'SEARCHING'
                : 'SEARCH'}
            </button>
          </form>
        </div>
      </section>

      <section className="explore__section">
        <div className="explore__section-header">
          <div>
            <p className="label">
              {isSearchResult
                ? 'SEARCH RESULTS'
                : 'DISCOVER'}
            </p>

            <h2 className="heading-lg">
              {isSearchResult
                ? `Results for "${query.trim()}"`
                : 'Something worth hearing.'}
            </h2>
          </div>

          {!isSearchResult && (
            <p className="explore__section-description">
              A selection of tracks from
              across the Now Playing library.
            </p>
          )}
        </div>

        {error && (
          <div className="explore__state">
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="explore__state">
            <p>Finding some music...</p>
          </div>
        )}

        {!loading &&
          !error &&
          songs.length === 0 && (
            <div className="explore__state">
              <p>
                No music found.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          songs.length > 0 && (
            <div className="explore__tracks">
              {songs.map((song) => (
                <article
                  key={song.id}
                  className="explore-track"
                >
                  <div className="explore-track__artwork">
                    {song.artworkUrl ? (
                      <img
                        src={
                          song.artworkUrl
                        }
                        alt={`${song.album} artwork`}
                      />
                    ) : (
                      <div className="explore-track__artwork-placeholder" />
                    )}
                  </div>

                  <div className="explore-track__info">
                    <h3>
                      {song.title}
                    </h3>

                    <p>
                      {song.artist}
                    </p>

                    <span>
                      {song.album}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="explore-track__action"
                    aria-label={`Open ${song.title}`}
                  >
                    <ArrowUpRight
                      size={18}
                    />
                  </button>
                </article>
              ))}
            </div>
          )}
      </section>

      <section className="explore__section explore__browse">
        <div className="explore__section-header">
          <div>
            <p className="label">
              BROWSE
            </p>

            <h2 className="heading-lg">
              Explore by sound.
            </h2>
          </div>
        </div>

        <div className="explore__categories">
          {genres.map((genre) => (
            <button
              key={genre}
              type="button"
              className="explore-category"
            >
              <span>
                {genre}
              </span>

              <ArrowUpRight
                size={16}
              />
            </button>
          ))}
        </div>
      </section>

      <section className="explore__section explore__decades">
        <div className="explore__section-header">
          <div>
            <p className="label">
              ERA
            </p>

            <h2 className="heading-lg">
              Take it back.
            </h2>
          </div>
        </div>

        <div className="explore__decade-list">
          {decades.map((decade) => (
            <button
              key={decade}
              type="button"
              className="explore-decade"
            >
              <span>
                {decade}
              </span>

              <ArrowUpRight
                size={17}
              />
            </button>
          ))}
        </div>
      </section>

    </main>
  )
}

export default Explore