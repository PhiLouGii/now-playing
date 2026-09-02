import './App.css'
import Navbar from './components/navigation/Navbar'
import Waveform from './components/music/Waveform'

function App() {
  return (
    <main className="app">
      <Navbar />

      <section className="hero">
  <Waveform />

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