
import {
  LogIn,
  LogOut,
  Trophy,
  BadgeQuestionMark,
  User,
  House,
  Gamepad2,
  Info,
  Menu,
  X,
} from 'lucide-react'

import {
  Link,
  NavLink,
  useNavigate,
  useLocation,
} from 'react-router-dom'

import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isSidebarPage = [
  '/',
  '/play',
  '/explore',
  '/leaderboard',
  '/profile',
  '/about',
].includes(pathname)

  const { user, profile, loading, logout } = useAuth()

  async function handleLogout() {
    try {
      await logout()
      setMobileOpen(false)
      navigate('/')
    } catch {
      // AuthContext handles the logging error.
    }
  }

  const username =
    profile?.username ||
    user?.displayName ||
    'Player'

  const mainLinks = [
    { to: '/', label: 'Home', icon: House, end: true },
    { to: '/play', label: 'Play', icon: Gamepad2 },
    { to: '/explore', label: 'Trivia', icon: BadgeQuestionMark },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/profile', label: 'Profile', icon: User },
  ]

  const secondaryLinks = [
    { to: '/about', label: 'About', icon: Info },
  ]

  function renderLinks(
    links: typeof mainLinks,
  ) {
    return links.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        onClick={() => setMobileOpen(false)}
        className="navbar__link"
      >
        <Icon size={17} />
        <span>{label}</span>
      </NavLink>
    ))
  }

  return (
    <nav
      className={[
        'navbar',
        isSidebarPage ? 'navbar--home' : '',
        mobileOpen ? 'navbar--open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="navbar-inner">
        {/* BRAND */}
        <NavLink
          to="/"
          className="navbar__brand"
          aria-label="NOW PLAYING home"
          onClick={() => setMobileOpen(false)}
        >
          <img
            src="/logo.png"
            alt="NOW PLAYING"
            className="navbar__logo"
          />
        </NavLink>

        {/* MOBILE MENU TOGGLE */}
        <button
          type="button"
          className="navbar__mobile-toggle"
          aria-label={
            mobileOpen ? 'Close navigation' : 'Open navigation'
          }
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* NAVIGATION */}
        <div
          className={`navbar__navigation${
            mobileOpen ? ' navbar__navigation--open' : ''
          }`}
        >
          <div className="navbar__links">
            {isSidebarPage ? (
              <>
                <div className="navbar__group">
                  <span className="navbar__group-label">
                    MAIN
                  </span>

                  {renderLinks(mainLinks)}
                </div>

                <div className="navbar__group">
                  <span className="navbar__group-label">
                    MORE
                  </span>

                  {renderLinks(secondaryLinks)}
                </div>
              </>
            ) : (
              <>
                <NavLink
                  to="/play"
                  className="navbar__link"
                  onClick={() => setMobileOpen(false)}
                >
                  <Gamepad2 size={17} />
                  <span>Play</span>
                </NavLink>

                <NavLink
                  to="/explore"
                  className="navbar__link"
                  onClick={() => setMobileOpen(false)}
                >
                  <BadgeQuestionMark size={17} />
                  <span>Trivia</span>
                </NavLink>

                <NavLink
                  to="/leaderboard"
                  className="navbar__link"
                  onClick={() => setMobileOpen(false)}
                >
                  <Trophy size={17} />
                  <span>Leaderboard</span>
                </NavLink>

                <NavLink
                  to="/about"
                  className="navbar__link"
                  onClick={() => setMobileOpen(false)}
                >
                  <Info size={17} />
                  <span>About</span>
                </NavLink>
              </>
            )}
          </div>

          {/* ACCOUNT ACTIONS */}
          <div className="navbar__account">
            {loading ? null : user ? (
              <>
                <Link
                  to="/profile"
                  className="navbar__user"
                  onClick={() => setMobileOpen(false)}
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
                  onClick={() => setMobileOpen(false)}
                >
                  <LogIn size={15} />
                  <span>Log in</span>
                </Link>

                <Link
                  to="/signup"
                  className="navbar__signup"
                  onClick={() => setMobileOpen(false)}
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>

        {/* MOBILE QUICK ACCOUNT ACTIONS */}
        {!loading && !user && (
          <div className="navbar__quick-account">
            <Link
              to="/login"
              className="navbar__login"
              onClick={() => setMobileOpen(false)}
            >
              Log in
            </Link>

            <Link
              to="/signup"
              className="navbar__signup"
              onClick={() => setMobileOpen(false)}
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
