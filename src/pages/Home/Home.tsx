import { ArrowUpRight, Disc3, Library, Scan, UserRoundSearch } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Hero from '../../components/home/Hero'
import GameModes from '../../components/home/GameModes'
import PlayByCategory from '../../components/home/PlayByCategory'
import './Home.css'

const otherModes = [
  {
    title: 'Pixel Cover',
    description: 'Recognise the album through the pixels.',
    path: '/pixel-cover',
    icon: Scan,
    tag: 'VISUAL ROUND',
  },
  {
    title: 'Play By Genre',
    description: 'Test your ear by guessing songs through their genre.',
    path: '/play',
    icon: Library,
    tag: 'GENRE RUN',
  },
  {
    title: 'Play by Artist',
    description: 'Stay in the world of one artist.',
    path: '/play',
    icon: UserRoundSearch,
    tag: 'ARTIST RUN',
  },
]

function Home() {
  const navigate = useNavigate()

  return (
    <div className="home">
      <div className="home__topline">
        <div>
          <p className="home__overline">YOUR MUSIC ARCADE</p>
          <h1>Good to have you back.</h1>
          <p className="home__subtitle">Pick a game, trust your ears, and see what you know.</p>
        </div>
        <div className="home__status"><span /> SOUND SYSTEM READY</div>
      </div>

      <Hero />

      <GameModes />

      <section className="home__other-modes">
        <div className="home__section-heading">
  <div>
    <p className="label">MORE WAYS TO PLAY</p>
    <h2>Other game modes</h2>
  </div>

  <div className="home__section-actions">
    <button
      type="button"
      className="home__more-button"
      onClick={() => navigate('/play')}
    >
      More ways to play
      <ArrowUpRight size={15} />
    </button>

  </div>
</div>

        <div className="home__other-grid">
          {otherModes.map((mode, index) => {
            const Icon = mode.icon
            return (
              <button
                type="button"
                className="home-mode-card"
                key={mode.title}
                onClick={() => navigate(mode.path)}
              >
                <span className="home-mode-card__index">0{index + 1}</span>
                <span className="home-mode-card__icon"><Icon size={20} /></span>
                <span className="home-mode-card__tag">{mode.tag}</span>
                <strong>{mode.title}</strong>
                <span className="home-mode-card__description">{mode.description}</span>
                <ArrowUpRight className="home-mode-card__arrow" size={18} />
              </button>
            )
          })}
        </div>
      </section>

      <div className="home__spin-heading">
        <div>
          <p className="label">CAN’T PICK?</p>
          <h2>Let fate choose for you.</h2>
        </div>
        <span><Disc3 size={16} /> RANDOMISE YOUR NEXT ROUND</span>
      </div>
      <PlayByCategory />
    </div>
  )
}

export default Home
