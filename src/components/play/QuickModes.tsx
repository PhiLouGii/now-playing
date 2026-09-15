import {
  CalendarDays,
  Zap,
  SlidersHorizontal,
  ArrowUpRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import './QuickModes.css'

type QuickMode = {
  icon: typeof CalendarDays
  label: string
  title: string
  description: string
  roundId?: string
}

const quickModes: QuickMode[] = [
  {
    icon: CalendarDays,
    label: 'DAILY',
    title: 'Daily Challenge',
    description:
      'One challenge. Everyone plays the same game.',
  },
  {
    icon: Zap,
    label: 'QUICK PLAY',
    title: 'Jump Right In',
    description:
      'No setup. Start a random round instantly.',
    roundId: 'mixed-challenge',
  },
  {
    icon: SlidersHorizontal,
    label: 'CUSTOM',
    title: 'Build Your Game',
    description:
      'Choose your categories and difficulty.',
  },
]

type QuickModesProps = {
  onSelectRound: (roundId: string) => void
}

function QuickModes({
  onSelectRound,
}: QuickModesProps) {
  const navigate = useNavigate()

  return (
    <section className="quick-modes">
      <div className="quick-modes__header">
        <p className="label">
          MORE WAYS TO PLAY
        </p>
      </div>

      <div className="quick-modes__grid">
        {quickModes.map((mode) => {
          const Icon = mode.icon

          return (
            <button
              key={mode.label}
              type="button"
              className="quick-mode"
              onClick={() => {
                if (mode.roundId) {
                  onSelectRound(mode.roundId)
                  return
                }

                if (mode.label === 'CUSTOM') {
                  navigate('/build-game')
                }
              }}
            >
              <div className="quick-mode__top">
                <div className="quick-mode__icon">
                  <Icon
                    size={19}
                    strokeWidth={1.8}
                  />
                </div>

                <ArrowUpRight
                  className="quick-mode__arrow"
                  size={17}
                />
              </div>

              <div className="quick-mode__content">
                <span className="quick-mode__label">
                  {mode.label}
                </span>

                <h3>{mode.title}</h3>

                <p>{mode.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default QuickModes
