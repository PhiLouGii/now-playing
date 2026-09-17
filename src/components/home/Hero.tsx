import { ArrowRight, Disc3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import Button from '../ui/Button'
import Waveform from '../music/Waveform'
import './Hero.css'

function Hero() {
  const navigate = useNavigate()

  return (
    <section className="hero">
      <div className="hero__inner">
        <div className="hero__content">
          <p className="hero__eyebrow">
            THE MUSIC GUESSING GAME
          </p>

          <h1 className="hero__title">
            Think you know
            <span>your music?</span>
          </h1>

          <p className="hero__tagline">
            Hear the song. Name the track. Beat your score.
          </p>

          <div className="hero__actions">
            <Button
              size="lg"
              onClick={() => navigate('/game')}
            >
              PLAY NOW
              <ArrowRight size={18} />
            </Button>
          </div>

          <p className="hero__meta">
            Songs · Artists · Albums · Years
          </p>
        </div>

        <div className="hero__player">
          <div className="hero__record">
            <Disc3 size={34} strokeWidth={1.5} />
          </div>

          <div className="hero__player-info">
            <div>
              <p className="label">
                NOW PLAYING
              </p>

              <h2>
                Mystery Track
              </h2>

              <p>
                Can you name it?
              </p>
            </div>

            <div className="hero__waveform">
              <Waveform />
            </div>

            <div className="hero__progress">
              <span>0:03</span>

              <div className="hero__progress-line">
                <div className="hero__progress-fill" />
              </div>

              <span>0:10</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero