import { useLocation } from 'react-router-dom'
import './App.css'
import Navbar from './components/navigation/Navbar'
import AppRoutes from './routes/AppRoutes'

function App() {
  const { pathname } = useLocation()

  const isHome = pathname === '/'
  const isPlay = pathname === '/play'
  const isLeaderboard = pathname === '/leaderboard'
  const isProfile = pathname === '/profile'

  const isSidebarPage =
    isHome || isPlay || isLeaderboard || isProfile

  const sidebarClass = isHome
    ? 'home'
    : isPlay
      ? 'play'
      : isLeaderboard
        ? 'leaderboard'
        : 'profile'

  return (
    <div
      className={`app${isSidebarPage ? ` app--${sidebarClass}` : ''}`}
    >
      <Navbar />
      <AppRoutes />
    </div>
  )
}

export default App