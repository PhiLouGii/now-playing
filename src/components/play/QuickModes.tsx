import {
  CalendarDays,
  Zap,
  SlidersHorizontal,
  ArrowUpRight,
} from 'lucide-react'
import './QuickModes.css'

const quickModes = [
  {
    icon: CalendarDays,
    label: 'DAILY',
    title: 'Daily Challenge',
    description: 'One challenge. Everyone plays the same game.',
  },
  {
    icon: Zap,
    label: 'QUICK PLAY',
    title: 'Jump Right In',
    description: 'No setup. Start a random round instantly.',
  },
  {
    icon: SlidersHorizontal,
    label: 'CUSTOM',
    title: 'Build Your Game',
    description: 'Choose your categories and difficulty.',
  },
]

function QuickModes() {
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
            >
              <div className="quick-mode__top">
                <div className="quick-mode__icon">
                  <Icon size={19} strokeWidth={1.8} />
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

                <h3>
                  {mode.title}
                </h3>

                <p>
                  {mode.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default QuickModes
