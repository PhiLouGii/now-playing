import {
  Music,
  Mic2,
  Disc3,
  CalendarDays,
  ArrowUpRight,
} from 'lucide-react'
import './GameModes.css'

const modes = [
  {
    number: '01',
    icon: Music,
    title: 'Name That Song',
    description: 'Hear the track. Pick the song.',
  },
  {
    number: '02',
    icon: Mic2,
    title: 'Guess The Artist',
    description: 'Can you recognize the voice?',
  },
  {
    number: '03',
    icon: Disc3,
    title: 'Guess The Album',
    description: 'Match the track to its album.',
  },
  {
    number: '04',
    icon: CalendarDays,
    title: 'Guess The Year',
    description: 'When did this hit drop?',
  },
]

function GameModes() {
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
              >
                <div className="mode-card__top">
                  <span className="mode-card__number">
                    {mode.number}
                  </span>

                  <div className="mode-card__icon">
                    <Icon size={20} strokeWidth={1.8} />
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
                  <ArrowUpRight size={16} />
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

