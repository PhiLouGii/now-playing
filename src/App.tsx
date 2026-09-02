import './App.css'
import Navbar from './components/navigation/Navbar'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <main className="app">
      <Navbar />
      <AppRoutes />
    </main>
  )
}

export default App
