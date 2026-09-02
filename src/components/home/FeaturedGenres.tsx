import { ArrowUpRight } from 'lucide-react'
import './FeaturedGenres.css'

const genres = [
  {
    name: 'Pop',
    count: '01',
  },
  {
    name: 'Hip-Hop',
    count: '02',
  },
  {
    name: 'R&B',
    count: '03',
  },
  {
    name: 'Afrobeats',
    count: '04',
  },
  {
    name: 'Amapiano',
    count: '05',
  },
  {
    name: 'Indie',
    count: '06',
  },
  {
    name: 'Rock',
    count: '07',
  },
  {
    name: 'Dancehall',
    count: '08',
  },
  {
    name: 'K-Pop',
    count: '09',
  },
  {
    name: 'House',
    count: '10',
  },
]

function FeaturedGenres() {
  return (
    <section className="genres">
      <div className="genres__container">

        <div className="genres__header">
          <div>
            <p className="label">
              EXPLORE MUSIC
            </p>

            <h2 className="heading-lg">
              Find your sound.
            </h2>
          </div>

          <p className="genres__intro">
            From chart-toppers to deep cuts,
            there's always another track to discover.
          </p>
        </div>

        <div className="genres__list">
          {genres.map((genre) => (
            <button
              key={genre.name}
              type="button"
              className="genre-item"
            >
              <span className="genre-item__number">
                {genre.count}
              </span>

              <span className="genre-item__name">
                {genre.name}
              </span>

              <ArrowUpRight
                className="genre-item__arrow"
                size={17}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          className="genres__view-all"
        >
          <span>VIEW ALL GENRES</span>
          <ArrowUpRight size={16} />
        </button>

      </div>
    </section>
  )
}

export default FeaturedGenres
