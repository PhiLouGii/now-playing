import {
  LogIn,
  LogOut,
  Trophy,
  BadgeQuestionMark,
  User,
  House,
  Gamepad2,
} from 'lucide-react'
import {
  Link,
  NavLink,
  useNavigate,
  useLocation,
} from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isHome = pathname === '/'

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
    <nav className={`navbar${isHome ? ' navbar--home' : ''}`}>
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
          {isHome && (
            <NavLink
              to="/"
              end
              className="navbar__link navbar__home-link"
            >
              <House size={17} />
              Home
            </NavLink>
          )}

          <NavLink
            to="/play"
            className="navbar__link"
          >
            <Gamepad2 size={17} />
            Play
          </NavLink>

          <NavLink
            to="/explore"
            className="navbar__link"
          >
            <BadgeQuestionMark size={17} />
            Trivia
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