import {
  Music,
  Mic2,
  Disc3,
  CalendarDays,
  ArrowUpRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './GameModes.css'

const modes = [
  {
    number: '01',
    icon: Music,
    title: 'Name That Song',
    description: 'Hear the track. Pick the song.',
    route: '/game',
    artwork: '/images/home/song-mode.jpg',
  },
  {
    number: '02',
    icon: Mic2,
    title: 'Guess The Artist',
    description: 'Can you recognize the voice?',
    route: '/artist-game',
    artwork: '/images/home/artist-mode.jpg',
  },
  {
    number: '03',
    icon: Disc3,
    title: 'Guess The Album',
    description: 'Match the track to its album.',
    route: '/album-game',
    artwork: '/images/home/album-mode.jpg',
  },
  {
    number: '04',
    icon: CalendarDays,
    title: 'Guess The Year',
    description: 'When did this hit drop?',
    route: '/year-game',
    artwork: '/images/home/year-mode.jpg',
  },
]

function GameModes() {
  const navigate = useNavigate()

  return (
    <section className="modes">
      <div className="modes__container">

        <div className="modes__header">
          <div>
            <p className="label">
              CHOOSE YOUR GAME
            </p>

            <h2 className="heading-lg">
              How do you want to play?
            </h2>
          </div>

          <p className="modes__intro">
            Four ways to put your music knowledge to the test.
          </p>
        </div>

        <div className="modes__grid">
          {modes.map((mode) => {
            const Icon = mode.icon

            return (
              <button
                key={mode.title}
                type="button"
                className="mode-card"
                onClick={() =>
                  navigate(mode.route)
                }
              >
                <div
                  className="mode-card__artwork"
                  style={{
                    backgroundImage: `url("${mode.artwork}")`,
                  }}
                  aria-hidden="true"
                />

                <div className="mode-card__overlay" />

                <div className="mode-card__top">
                  <span className="mode-card__number">
                    {mode.number}
                  </span>

                  <div className="mode-card__icon">
                    <Icon
                      size={20}
                      strokeWidth={1.8}
                    />
                  </div>
                </div>

                <div className="mode-card__content">
                  <h3>
                    {mode.title}
                  </h3>

                  <p>
                    {mode.description}
                  </p>
                </div>

                <div className="mode-card__action">
                  <span>PLAY</span>

                  <ArrowUpRight
                    size={16}
                  />
                </div>
              </button>
            )
          })}
        </div>

      </div>
    </section>
  )
}

export default GameModes