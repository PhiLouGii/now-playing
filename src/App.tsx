import { useLocation } from 'react-router-dom'
import './App.css'
import Navbar from './components/navigation/Navbar'
import AppRoutes from './routes/AppRoutes'

function App() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const isPlay = pathname === '/play'

  return (
    <main
      className={`app${isHome ? ' app--home' : ''}${isPlay ? ' app--play' : ''}`}
    >
      <Navbar />
      <AppRoutes />
    </main>
  )
}

export default App