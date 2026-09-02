import FeaturedGame from '../../components/play/FeaturedGame'
import QuickModes from '../../components/play/QuickModes'
import './Play.css'

function Play() {
  return (
    <div className="play-page">
      <div className="play-page__container">

        <header className="play-page__header">
          <p className="label">
            PLAY
          </p>

          <h1 className="display-lg">
            Choose your challenge.
          </h1>

          <p className="play-page__intro">
            Test your music knowledge across songs,
            artists, albums, and more.
          </p>
        </header>

        <FeaturedGame />
        <QuickModes />

      </div>
    </div>
  )
}

export default Play
