import { ArrowRight, Headphones } from 'lucide-react'
import Button from '../ui/Button'
import './FeaturedGame.css'

type FeaturedGameProps = {
  onSelectRound: (roundId: string) => void
}

function FeaturedGame({
  onSelectRound,
}: FeaturedGameProps) {
  return (
    <section className="featured-game">
      <div className="featured-game__number">
        01
      </div>

      <div className="featured-game__content">
        <div className="featured-game__category">
          FEATURED GAME
        </div>

        <h2>
          Name That Song
        </h2>

        <p className="featured-game__description">
          Hear a mystery track and see if you can
          identify it before the clock runs out.
        </p>

        <div className="featured-game__details">
          <span>5 QUESTIONS</span>
          <span>MULTIPLE CHOICE</span>
          <span>TIME BONUS</span>
        </div>
      </div>

      <div className="featured-game__action">
        <div className="featured-game__icon">
          <Headphones
            size={22}
            strokeWidth={1.8}
          />
        </div>

        <Button
          size="lg"
          onClick={() =>
            onSelectRound(
              'name-that-song',
            )
          }
        >
          PLAY
          <ArrowRight size={18} />
        </Button>
      </div>
    </section>
  )
}

export default FeaturedGame
