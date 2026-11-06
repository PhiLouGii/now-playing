import { useLocation } from 'react-router-dom'
import './App.css'
import Navbar from './components/navigation/Navbar'
import AppRoutes from './routes/AppRoutes'

function App() {
  const { pathname } = useLocation()

  const isPixelCover = pathname === '/pixel-cover'

const sidebarPages = [
  '/',
  '/play',
  '/explore',
  '/leaderboard',
  '/profile',
  '/about',
]

const isSidebarPage =
  isPixelCover ||
  sidebarPages.some((page) =>
    page === '/'
      ? pathname === '/'
      : pathname === page || pathname.startsWith(`${page}/`)
  )

const pageClass = isPixelCover
  ? 'play'
  : pathname === '/'
    ? 'home'
    : pathname.slice(1)

  return (
    <div className={`app${isSidebarPage ? ` app--${pageClass}` : ''}`}>
      <Navbar />
      <AppRoutes />
    </div>
  )
}

export default App
