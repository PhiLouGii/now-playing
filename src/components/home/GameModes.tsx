import {
  Disc3,
  Headphones,
  Mic2,
  Radio,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import './GameModes.css'

const gameModes = [
  {
    number: '01',
    title: 'Name the Song',
    description: 'Hear it. Name it.',
    path: '/game',
    icon: Disc3,
    artwork: '/images/home/song-mode.jpg',
    className: 'game-mode--primary',
  },
  {
    number: '02',
    title: 'Name the Artist',
    description: 'Know who made it?',
    path: '/artist-game',
    icon: Mic2,
    artwork: '/images/home/artist-mode.jpg',
    className: '',
  },
  {
    number: '03',
    title: 'Name the Album',
    description: 'Recognise the record.',
    path: '/album-game',
    icon: Radio,
    artwork: '/images/home/album-mode.jpg',
    className: '',
  },
  {
    number: '04',
    title: 'Guess the Year',
    description: 'When did it drop?',
    path: '/year-game',
    icon: Headphones,
    artwork: '/images/home/year-mode.jpg',
    className: '',
  },
  {
    number: '05',
    title: 'Endless',
    description: 'Keep your streak alive.',
    path: '/endless',
    icon: Sparkles,
    artwork: '/images/home/endless-mode.jpg',
    className: 'game-mode--endless',
  },
]

function GameModes() {
  const navigate = useNavigate()

  return (
    <section className="game-modes">
      <div className="game-modes__container">
        <div className="game-modes__header">
          <div>
            <p className="label">PLAY</p>

            <h2>Choose your game</h2>
          </div>

          <p className="game-modes__hint">
            Pick a mode and see how well you really know your music.
          </p>
        </div>

        <div className="game-modes__grid">
          {gameModes.map((mode) => {
            const Icon = mode.icon

            return (
              <button
                key={mode.title}
                type="button"
                className={`game-mode ${mode.className}`}
                onClick={() => navigate(mode.path)}
              >
                <div
                  className="game-mode__artwork"
                  style={{
                    backgroundImage: `url("${mode.artwork}")`,
                  }}
                  aria-hidden="true"
                />

                <div
                  className="game-mode__overlay"
                  aria-hidden="true"
                />

                <div className="game-mode__top">
                  <span className="game-mode__number">
                    {mode.number}
                  </span>

                  <span className="game-mode__icon">
                    <Icon
                      size={19}
                      strokeWidth={1.8}
                    />
                  </span>
                </div>

                <div className="game-mode__info">
                  <h3>{mode.title}</h3>
                  <p>{mode.description}</p>
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