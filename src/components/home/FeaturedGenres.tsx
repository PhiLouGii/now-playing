import './FeaturedGenres.css'

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

function FeaturedGenres() {
  return (
    <section className="genres">
      <div className="genres__container">
        <div className="genres__header">
          <p className="label">
            EXPLORE MUSIC
          </p>

          <h2 className="heading-lg">
            Find your sound.
          </h2>
        </div>

        <div className="genres__list">
          {genres.map((genre) => (
            <button
              key={genre}
              type="button"
              className="genre-pill"
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedGenres