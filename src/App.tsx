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
    '/about',
  ]

  const isSidebarPage = sidebarPages.includes(pathname)

  const pageClass =
    pathname === '/'
      ? 'home'
      : pathname.slice(1)

  return (
    <div
      className={`app${isSidebarPage ? ` app--${pageClass}` : ''}`}
    >
      <Navbar />
      <AppRoutes />
    </div>
  )
}

export default App