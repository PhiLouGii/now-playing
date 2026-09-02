import { Flame, ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import './DailyChallenge.css'

function DailyChallenge() {
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
                NAME THAT SONG
              </p>

              <h2>
                Can you identify today's hit?
              </h2>
            </div>

            <p className="daily__description">
              One mystery track. Four possible answers.
              How quickly can you get it?
            </p>

            <div className="daily__details">
              <span>1 SONG</span>
              <span>4 ANSWERS</span>
              <span>TIME BONUS</span>
            </div>
          </div>

          <div className="daily__action">
            <Button variant="secondary">
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

