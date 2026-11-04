import { useLocation } from 'react-router-dom'
import './App.css'
import Navbar from './components/navigation/Navbar'
import AppRoutes from './routes/AppRoutes'

function App() {
  const { pathname } = useLocation()

  const isHome = pathname === '/'
  const isPlay = pathname === '/play'
  const isLeaderboard = pathname === '/leaderboard'

  const isSidebarPage =
    isHome || isPlay || isLeaderboard

  return (
    <main
      className={`app${isSidebarPage ? ` app--${isHome ? 'home' : isPlay ? 'play' : 'leaderboard'}` : ''}`}
    >
      <Navbar />
      <AppRoutes />
    </main>
  )
}

export default App