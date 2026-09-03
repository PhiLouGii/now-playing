import { useNavigate } from 'react-router-dom'
import { rounds } from '../../data/rounds'
import FeaturedGame from '../../components/play/FeaturedGame'
import QuickModes from '../../components/play/QuickModes'
import './Play.css'

function Play() {
  const navigate = useNavigate()

  function handleSelectRound(
    roundId: string,
  ) {
    const roundConfig = rounds.find(
      (round) => round.id === roundId,
    )

    if (!roundConfig) {
      return
    }

    navigate('/game', {
      state: {
        roundConfig,
      },
    })
  }

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
            Test your music knowledge across
            songs, artists, albums, and more.
          </p>
        </header>

        <FeaturedGame
          onSelectRound={
            handleSelectRound
          }
        />

        <QuickModes
          onSelectRound={
            handleSelectRound
          }
        />
      </div>
    </div>
  )
}

export default Play
