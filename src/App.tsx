import { useLocation } from 'react-router-dom'
import './App.css'
import Navbar from './components/navigation/Navbar'
import AppRoutes from './routes/AppRoutes'

function App() {
  const { pathname } = useLocation()


const sidebarPages = [
  '/',
  '/play',
  '/game',
  '/explore',
  '/leaderboard',
  '/profile',
  '/about',
]

const isPlaySubpage =
  pathname === '/pixel-cover' ||
  pathname === '/artists' ||
  pathname === '/play-by-artist' ||
  pathname.startsWith('/play/')

const matchingPage = sidebarPages.find((page) =>
  page === '/'
    ? pathname === '/'
    : pathname === page || pathname.startsWith(`${page}/`)
)

const isSidebarPage = Boolean(matchingPage) || isPlaySubpage

const pageClass = isPlaySubpage
  ? 'play'
  : matchingPage === '/'
    ? 'home'
    : matchingPage?.slice(1) ?? ''

  return (
    <div className={`app${isSidebarPage ? ` app--${pageClass}` : ''}`}>
      <Navbar />
      <AppRoutes />
    </div>
  )
}

export default App
