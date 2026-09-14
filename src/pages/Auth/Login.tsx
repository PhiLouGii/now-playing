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
      <section className="auth-card">
        <div className="auth-header">
          <p className="auth-eyebrow">
            NOW PLAYING
          </p>

          <h1>Welcome back</h1>

          <p>
            Log in to continue playing,
            track your scores, and climb
            the leaderboard.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="auth-field">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Your password"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? 'Logging in...'
              : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/signup">
            Create one
          </Link>
        </p>
      </section>
    </main>
  )
}

export default Login
