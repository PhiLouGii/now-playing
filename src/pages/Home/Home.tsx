import {
  ArrowRight,
  LogOut,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import Hero from '../../components/home/Hero'
import DailyChallenge from '../../components/home/DailyChallenge'
import GameModes from '../../components/home/GameModes'
import PlayByCategory from '../../components/home/PlayByCategory'
import { useAuth } from '../../context/AuthContext'

function Home() {
  const {
    user,
    loading,
    logout,
  } = useAuth()

  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // AuthContext handles logging the error.
    }
  }

  function handleEndlessMode() {
    navigate('/endless')
  }

  return (
    <div className="home">
      <Hero />

      <DailyChallenge />

      <GameModes />

      <section className="endless-mode">
        <div className="endless-mode__content">
          <p className="label">
            ENDLESS
          </p>

          <h2 className="heading-lg">
            How long can you keep your streak alive?
          </h2>

          <p>
            Keep guessing songs for as long as you can.
            No rounds. No stopping. Just music.
          </p>

          <button
            type="button"
            onClick={handleEndlessMode}
            className="endless-mode__button"
          >
            PLAY ENDLESS
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <PlayByCategory />

      {!loading && user && (
        <button
          type="button"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Log out
        </button>
      )}
    </div>
  )
}

export default Home