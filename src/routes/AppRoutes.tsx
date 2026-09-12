import { Routes, Route } from 'react-router-dom'

import Home from '../pages/Home/Home'
import Play from '../pages/Play/Play'
import Explore from '../pages/Explore/Explore'
import Leaderboard from '../pages/Leaderboard/Leaderboard'
import Profile from '../pages/Profile/Profile'
import Game from '../pages/Game/Game'
import ArtistGame from '../pages/ArtistGame/ArtistGame'
import AlbumGame from '../pages/AlbumGame/AlbumGame'
import YearGame from '../pages/YearGame/YearGame'
import DailyChallenge from '../pages/DailyChallenge/DailyChallenge'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play" element={<Play />} />
      <Route path="/game" element={<Game />} />
      <Route
        path="/artist-game"
        element={<ArtistGame />}
      />
      <Route
        path="/album-game"
        element={<AlbumGame />}
      />
      <Route path="/year-game" element={<YearGame />} />
      <Route path="/daily-challenge" element={<DailyChallenge />} />
      <Route path="/explore" element={<Explore />} />
      <Route
        path="/leaderboard"
        element={<Leaderboard />}
      />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  )
}

export default AppRoutes