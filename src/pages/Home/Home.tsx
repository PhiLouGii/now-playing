import Hero from '../../components/home/Hero'
import DailyChallenge from '../../components/home/DailyChallenge'
import GameModes from '../../components/home/GameModes'
import PlayByCategory from '../../components/home/PlayByCategory'

function Home() {
  return (
    <div className="home">
      <Hero />

      <DailyChallenge />

      <GameModes />

      <PlayByCategory />
    </div>
  )
}

export default Home