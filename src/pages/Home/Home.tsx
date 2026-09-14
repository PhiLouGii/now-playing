import { LogOut } from 'lucide-react'

import Hero from '../../components/home/Hero'
import DailyChallenge from '../../components/home/DailyChallenge'
import GameModes from '../../components/home/GameModes'
import FeaturedGenres from '../../components/home/FeaturedGenres'
import { useAuth } from '../../context/AuthContext'

function Home() {
  const {
    user,
    loading,
    logout,
  } = useAuth()

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // AuthContext handles logging the error.
    }
  }

  return (
    <div className="home">
      <Hero />
      <DailyChallenge />
      <GameModes />
      <FeaturedGenres />

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
