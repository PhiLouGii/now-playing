import {
  ArrowRight,
  Flame,
} from 'lucide-react'
import {
  useNavigate,
} from 'react-router-dom'

import Button from '../ui/Button'
import './DailyChallenge.css'

function DailyChallenge() {
  const navigate = useNavigate()

  return (
    <section className="daily">
      <div className="daily__container">
        <div className="daily__header">
          <p className="label">
            TODAY
          </p>

          <div className="daily__streak">
            <Flame size={14} />
            <span>STREAK 01</span>
          </div>
        </div>

        <div className="daily__card">
          <div className="daily__index">
            <span>01</span>
            <small>DAILY</small>
          </div>

          <div className="daily__content">
            <div className="daily__title-row">
              <p className="daily__eyebrow">
                DAILY CHALLENGE
              </p>

              <h2>
                Today's music challenge
              </h2>
            </div>

            <p className="daily__description">
              Ten mystery tracks. Four ways to prove
              how well you know your music.
            </p>

            <div className="daily__details">
              <span>10 SONGS</span>
              <span>4 MODES</span>
              <span>TIME BONUS</span>
            </div>
          </div>

          <div className="daily__action">
            <Button
              variant="secondary"
              onClick={() =>
                navigate('/daily-challenge')
              }
            >
              PLAY
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DailyChallenge