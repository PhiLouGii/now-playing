import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import {
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { Link, useNavigate } from 'react-router-dom'

import { auth, firestore } from '../../config/firebase'
import './Auth.css'

function SignUp() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    const trimmedUsername = username.trim()
    const trimmedEmail = email.trim()

    if (!trimmedUsername) {
      setError('Please choose a username.')
      return
    }

    if (trimmedUsername.length < 3) {
      setError(
        'Username must be at least 3 characters.',
      )
      return
    }

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters.',
      )
      return
    }

    try {
      setLoading(true)

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          trimmedEmail,
          password,
        )

      const user = userCredential.user

      await updateProfile(user, {
        displayName: trimmedUsername,
      })

      await setDoc(
        doc(firestore, 'users', user.uid),
        {
          username: trimmedUsername,
          displayName: trimmedUsername,
          email: user.email,
          createdAt: serverTimestamp(),
        },
      )

      navigate('/')
    } catch (err: unknown) {
      console.error('SIGN UP ERROR:', err)

      if (err instanceof Error) {
        console.error(
          'Error message:',
          err.message,
        )
      }

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
          case 'auth/email-already-in-use':
            setError(
              'An account with this email already exists.',
            )
            break

          case 'auth/invalid-email':
            setError(
              'Please enter a valid email address.',
            )
            break

          case 'auth/weak-password':
            setError(
              'Your password is too weak. Use at least 6 characters.',
            )
            break

          default:
            setError(
              err instanceof Error
                ? err.message
                : 'Something went wrong. Please try again.',
            )
        }
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.',
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

          <h1>Create your account</h1>

          <p>
            Make an account to save your scores,
            track your progress, and climb the
            leaderboard.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="auth-field">
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Choose a username"
              autoComplete="username"
              disabled={loading}
            />
          </div>

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
              placeholder="At least 6 characters"
              autoComplete="new-password"
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
              ? 'Creating account...'
              : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  )
}

export default SignUp
