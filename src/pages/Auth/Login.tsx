import { useState } from 'react'
import {
  signInWithEmailAndPassword,
} from 'firebase/auth'
import {
  Link,
  useNavigate,
} from 'react-router-dom'

import { auth } from '../../config/firebase'
import './Auth.css'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError('Please enter your email address.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    try {
      setLoading(true)

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          trimmedEmail,
          password,
        )

      console.log(
        'LOGIN SUCCESS:',
        userCredential.user.uid,
      )

      navigate('/')
    } catch (err: unknown) {
      console.error(
        'LOGIN ERROR:',
        err,
      )

      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err
      ) {
        const firebaseError = err as {
          code: string
        }

        console.error(
          'Firebase error code:',
          firebaseError.code,
        )

        switch (firebaseError.code) {
          case 'auth/invalid-credential':
            setError(
              'Incorrect email or password.',
            )
            break

          case 'auth/user-not-found':
            setError(
              'No account was found with this email.',
            )
            break

          case 'auth/wrong-password':
            setError(
              'Incorrect email or password.',
            )
            break

          case 'auth/invalid-email':
            setError(
              'Please enter a valid email address.',
            )
            break

          case 'auth/too-many-requests':
            setError(
              'Too many attempts. Please try again later.',
            )
            break

          default:
            setError(
              'Something went wrong. Please try again.',
            )
        }
      } else {
        setError(
          'Something went wrong. Please try again.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

 
return (
  <main className="auth-page">
    <section className="auth-shell">
      <aside className="auth-player">
        <div className="auth-brand">
          <span className="auth-brand-dot" />
          NOW PLAYING
        </div>

        <div className="auth-player-content">
          <div className="auth-album-art" aria-label="Abstract record artwork">
            <span className="auth-art-label">NP / 001</span>
          </div>

          <div className="auth-track">
            <span className="auth-track-label">
              PICK UP WHERE YOU LEFT OFF
            </span>
            <h2>It's your turn.</h2>
            <p>Your next high score awaits.</p>
          </div>
        </div>

        <div className="auth-player-controls">
          <div className="auth-progress">
            <div className="auth-progress-fill" />
          </div>

          <div className="auth-player-meta">
            <span>BACK TO THE MUSIC</span>
            <div className="auth-equalizer" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className="auth-player-footer">
          A LITTLE MUSIC. A LOT OF NOSTALGIA.
        </div>
      </aside>

      <div className="auth-content">
        <header className="auth-header">
          <p className="auth-eyebrow">WELCOME BACK</p>
          <h1>Back in the mix.</h1>
          <p>
            Log in to continue playing,
            track your scores, and climb
            the leaderboard.
          </p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log in'}
            {!loading && <span aria-hidden="true">↗</span>}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/signup">Create one</Link>
        </p>

        <div className="auth-content-footer">
          YOUR MUSIC. YOUR MEMORY. YOUR SCORE.
        </div>
      </div>
    </section>
  </main>
)
}

export default Login
