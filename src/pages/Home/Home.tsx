import Hero from '../../components/home/Hero'
import DailyChallenge from '../../components/home/DailyChallenge'
import GameModes from '../../components/home/GameModes'
import FeaturedGenres from '../../components/home/FeaturedGenres'

function Home() {
  return (
    <div className="home">
      <Hero />
      <DailyChallenge />
      <GameModes />
      <FeaturedGenres />
    </div>
  )
}

export default Home