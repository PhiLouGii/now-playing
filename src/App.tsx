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

const matchingPage = sidebarPages.find((page) =>
  page === '/'
    ? pathname === '/'
    : pathname === page || pathname.startsWith(`${page}/`)
)

const pageClass =
  matchingPage === '/'
    ? 'home'
    : matchingPage?.slice(1) ?? ''

const isSidebarPage = Boolean(matchingPage)

  return (
    <div className={`app${isSidebarPage ? ` app--${pageClass}` : ''}`}>
      <Navbar />
      <AppRoutes />
    </div>
  )
}

export default App
