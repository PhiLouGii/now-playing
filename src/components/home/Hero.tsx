import { ArrowRight } from 'lucide-react'
import Button from '../ui/Button'
import Waveform from '../music/Waveform'
import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      <Waveform />

      <div className="hero__content">
        <p className="hero__eyebrow">
          THE MUSIC GUESSING GAME
        </p>

        <h1 className="hero__title">
          NOW
          <span>PLAYING</span>
        </h1>

        <p className="hero__tagline">
          You heard it. Now prove it.
        </p>

        <div className="hero__actions">
          <Button size="lg">
            PLAY NOW
            <ArrowRight size={18} />
          </Button>
        </div>

        <p className="hero__meta">
          Songs. Artists. Albums. Years.
        </p>
      </div>
    </section>
  )
}

export default Hero

