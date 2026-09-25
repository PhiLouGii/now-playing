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
import PlayByArtist from '../pages/PlayByArtist/PlayByArtist'
import Artists from '../pages/Artists/Artists'
import DailyChallenge from '../pages/DailyChallenge/DailyChallenge'
import DailyChallengeResults from '../pages/DailyChallenge/DailyChallengeResults'
import SignUp from '../pages/Auth/SignUp'
import Login from '../pages/Auth/Login'
import EndlessGame from '../pages/EndlessGame/EndlessGame'
import BuildGame from '../pages/BuildGame/BuildGame'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play" element={<Play />} />
      <Route
  path="/artists"
  element={<Artists />}
/>
      <Route path="/game" element={<Game />} />
      <Route
        path="/artist-game"
        element={<ArtistGame />}
      />
      <Route
  path="/play-by-artist"
  element={<PlayByArtist />}
/>
      <Route
        path="/album-game"
        element={<AlbumGame />}
      />
      <Route path="/year-game" element={<YearGame />} />
      <Route
  path="/endless"
  element={<EndlessGame />}
/>
<Route
  path="/build-game"
  element={<BuildGame />}
/>
      <Route path="/daily-challenge" element={<DailyChallenge />} />
      <Route path="/daily-challenge-results" element={<DailyChallengeResults />} />
      <Route path="/explore" element={<Explore />} />
      <Route
        path="/leaderboard"
        element={<Leaderboard />}
      />
      <Route path="/profile" element={<Profile />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}

export default AppRoutes