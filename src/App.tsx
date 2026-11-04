import { useLocation } from 'react-router-dom'
import './App.css'
import Navbar from './components/navigation/Navbar'
import AppRoutes from './routes/AppRoutes'

function App() {
  const { pathname } = useLocation()

  const sidebarPages = [
    '/',
    '/play',
    '/explore',
    '/leaderboard',
    '/profile',
  ]

  const isSidebarPage = sidebarPages.includes(pathname)

  return (
    <div
      className={`app${isSidebarPage ? ` app--${pathname === '/' ? 'home' : pathname.slice(1) === 'explore' ? 'explore' : pathname.slice(1)}` : ''}`}
    >
      <Navbar />
      <AppRoutes />
    </div>
  )
}

export default App