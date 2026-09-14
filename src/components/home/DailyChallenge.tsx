import {
  Flame,
  ArrowRight,
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

        <div className="daily__topline">
          <p className="label daily__eyebrow">
            DAILY CHALLENGE
          </p>

          <div className="daily__streak">
            <Flame size={16} />
            <span>STREAK 01</span>
          </div>
        </div>

        <div className="daily__card">

          <div className="daily__number">
            <span>01</span>
            <small>TODAY</small>
          </div>

          <div className="daily__main">
            <div className="daily__heading">
              <p className="daily__category">
                DAILY MIX
              </p>

              <h2>
                Today's music challenge is waiting.
              </h2>
            </div>

            <p className="daily__description">
              Ten mystery tracks. Different ways to
              test how well you really know your music.
            </p>

            <div className="daily__details">
              <span>10 SONGS</span>
              <span>4 QUESTION TYPES</span>
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
              <ArrowRight size={17} />
            </Button>
          </div>

        </div>
      </div>
    </section>
  )
}

export default DailyChallenge