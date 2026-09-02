import './App.css'
import Navbar from './components/navigation/Navbar'

function App() {
  return (
    <main className="app">
      <Navbar />

      <section className="hero">
        <div className="hero__content">
          <p className="hero__eyebrow">
            THE MUSIC GUESSING GAME
          </p>

          <h1 className="hero__title">
            NOW PLAYING
          </h1>

          <p className="hero__tagline">
            You heard it. Now prove it.
          </p>
        </div>
      </section>
    </main>
  )
}

export default App