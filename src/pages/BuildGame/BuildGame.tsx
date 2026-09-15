import './BuildGame.css'

function BuildGame() {
  return (
    <div className="build-game-page">
      <div className="build-game-page__container">
        <header className="build-game-page__header">
          <p className="label">
            CUSTOM GAME
          </p>

          <h1 className="display-lg">
            Build Your Game.
          </h1>

          <p>
            Choose how you want to play.
          </p>
        </header>

        <section className="build-game">
          <h2>What do you want to guess?</h2>

          <div className="build-game__options">
            <button type="button">
              Name That Song
            </button>

            <button type="button">
              Name the Artist
            </button>

            <button type="button">
              Name the Album
            </button>

            <button type="button">
              Guess the Year
            </button>

            <button type="button">
              Mixed
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default BuildGame
