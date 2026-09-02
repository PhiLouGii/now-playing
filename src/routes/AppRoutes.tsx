import { Routes, Route } from 'react-router-dom'

import Home from '../pages/Home/Home'
import Play from '../pages/Play/Play'
import Explore from '../pages/Explore/Explore'
import Leaderboard from '../pages/Leaderboard/Leaderboard'
import Profile from '../pages/Profile/Profile'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play" element={<Play />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  )
}

export default AppRoutes
