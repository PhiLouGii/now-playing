import {
  LogIn,
  LogOut,
  Trophy,
  Compass,
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
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink
  to="/"
  className="navbar__brand"
  aria-label="NOW PLAYING home"
>
  <img
    src="/logo.png"
    alt="NOW PLAYING"
    className="navbar__logo"
  />
</NavLink>

        <div className="navbar__links">
          <NavLink
            to="/play"
            className="navbar__link"
          >
            Play
          </NavLink>

          <NavLink
            to="/explore"
            className="navbar__link"
          >
            <Compass size={17} />
            Explore
          </NavLink>

          <NavLink
            to="/leaderboard"
            className="navbar__link"
          >
            <Trophy size={17} />
            Leaderboard
          </NavLink>

          <NavLink
            to="/profile"
            className="navbar__link"
          >
            <User size={17} />
            Profile
          </NavLink>
        </div>

        <div className="navbar__account">
          {loading ? null : user ? (
            <>
              <Link
                to="/profile"
                className="navbar__user"
              >
                <span className="navbar__user-icon">
                  <User size={15} />
                </span>

                <span className="navbar__username">
                  {username}
                </span>
              </Link>

              <button
                type="button"
                className="navbar__logout"
                onClick={handleLogout}
                aria-label="Log out"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="navbar__login"
              >
                <LogIn size={15} />
                <span>Log in</span>
              </Link>

              <Link
                to="/signup"
                className="navbar__signup"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar