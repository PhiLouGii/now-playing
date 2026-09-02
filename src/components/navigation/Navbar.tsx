import {
  Music,
  Trophy,
  Compass,
  User,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <NavLink
        to="/"
        className="navbar__brand"
        aria-label="NOW PLAYING home"
      >
        <div className="navbar__logo">
          <Music size={20} />
        </div>

        <span className="navbar__title">
          NOW PLAYING
        </span>
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
    </nav>
  )
}

export default Navbar
