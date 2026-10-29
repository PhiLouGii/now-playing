import { useLocation } from 'react-router-dom'
import './App.css'
import Navbar from './components/navigation/Navbar'
import AppRoutes from './routes/AppRoutes'

function App() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <main className={`app${isHome ? ' app--home' : ''}`}>
      <Navbar />
      <AppRoutes />
    </main>
  )
}

export default App
