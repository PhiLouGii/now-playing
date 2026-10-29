import { AudioLines, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Explore.css'

function Explore() {
  return (
    <main className="trivia-placeholder">
      <div className="trivia-placeholder__art" aria-hidden="true">
        <AudioLines size={42} strokeWidth={1.3} />
      </div>
      <p className="label">NOW PLAYING · PHASE 2</p>
      <h1>Trivia is on the way.</h1>
      <p className="trivia-placeholder__copy">
        A new way to test your music knowledge is in the works. For now, there are plenty of tracks to recognise.
      </p>
      <div className="trivia-placeholder__status"><Sparkles size={15} /> CURRENTLY IN THE MIX</div>
      <Link to="/" className="trivia-placeholder__link">Back to the dashboard</Link>
    </main>
  )
}

export default Explore
