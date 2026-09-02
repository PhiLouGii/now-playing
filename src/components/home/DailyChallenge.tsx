import { Flame, ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import './DailyChallenge.css'

function DailyChallenge() {
  return (
    <section className="daily">
      <div className="daily__container">
        <div className="daily__header">
          <div>
            <p className="label daily__eyebrow">
              DAILY CHALLENGE
            </p>

            <h2 className="heading-lg">
              Can you identify today's hit?
            </h2>
          </div>

          <div className="daily__streak">
            <Flame size={18} />
            <span>Keep your streak alive</span>
          </div>
        </div>

        <Card className="daily__card">
          <div className="daily__info">
            <span className="daily__number">
              01
            </span>

            <div>
              <h3 className="heading-md">
                Name That Song
              </h3>

              <p className="body-sm daily__description">
                One mystery track. Four possible answers.
                How quickly can you get it?
              </p>
            </div>
          </div>

          <Button variant="secondary">
            PLAY
            <ArrowRight size={17} />
          </Button>
        </Card>
      </div>
    </section>
  )
}

export default DailyChallenge