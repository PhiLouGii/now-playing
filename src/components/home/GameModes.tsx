import {
  Music,
  Mic2,
  Disc3,
  CalendarDays,
} from 'lucide-react'
import './GameModes.css'

const modes = [
  {
    icon: Music,
    title: 'Name That Song',
    description: 'Hear the track. Pick the song.',
  },
  {
    icon: Mic2,
    title: 'Guess The Artist',
    description: 'Can you recognize the voice?',
  },
  {
    icon: Disc3,
    title: 'Guess The Album',
    description: 'Match the track to its album.',
  },
  {
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
          <p className="label">
            CHOOSE YOUR GAME
          </p>

          <h2 className="heading-lg">
            How do you want to play?
          </h2>
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
                <div className="mode-card__icon">
                  <Icon size={22} />
                </div>

                <div className="mode-card__content">
                  <h3 className="heading-md">
                    {mode.title}
                  </h3>

                  <p className="body-sm">
                    {mode.description}
                  </p>
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