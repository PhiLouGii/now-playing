import {
  LogIn,
  LogOut,
  User,
} from 'lucide-react'
import {
  Link,
  NavLink,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()

    const {
    user,
    profile,
    loading,
    logout,
  } = useAuth()

  console.log('NAVBAR:', {
    user,
    profile,
    loading,
  })

  async function handleLogout() {
    try {
      await logout()
      navigate('/')
    } catch {
      // AuthContext handles logging the error.
    }
  }

  const username =
    profile?.username ||
    user?.displayName ||
    'Player'

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link
          to="/"
          className="navbar-logo"
        >
          NOW PLAYING
        </Link>

        <nav className="navbar-links">
          <NavLink
            to="/"
            className="navbar-link"
          >
            Home
          </NavLink>

          <NavLink
            to="/play"
            className="navbar-link"
          >
            Play
          </NavLink>

          <NavLink
            to="/explore"
            className="navbar-link"
          >
            Explore
          </NavLink>

          <NavLink
            to="/leaderboard"
            className="navbar-link"
          >
            Leaderboard
          </NavLink>
        </nav>

        <div className="navbar-account">
          {loading ? null : user ? (
            <>
              <Link
                to="/profile"
                className="navbar-profile"
              >
                <span className="navbar-profile-icon">
                  <User size={16} />
                </span>

                <span className="navbar-username">
                  {username}
                </span>
              </Link>

              <button
                type="button"
                className="navbar-logout"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="navbar-login"
              >
                <LogIn size={16} />
                <span>Log in</span>
              </Link>

              <Link
                to="/signup"
                className="navbar-signup"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
