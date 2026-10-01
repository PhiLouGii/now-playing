import {
  useEffect,
  useState,
} from 'react'

import LoadingScreen from '../../components/loading/LoadingScreen'
import {
  getLoadingFacts,
  type LoadingFact,
} from '../../services/gameService'

export default function LoadingTest() {
  const [
    facts,
    setFacts,
  ] = useState<LoadingFact[]>([])

  const [
    error,
    setError,
  ] = useState<string | null>(null)

  useEffect(() => {
    async function loadFacts() {
      try {
        const data =
          await getLoadingFacts()

        setFacts(data.facts)
      } catch (err) {
        console.error(
          'Failed to load loading facts:',
          err,
        )

        setError(
          'Could not load music facts.',
        )
      }
    }

    loadFacts()
  }, [])

  if (error) {
    return (
      <main>
        <p>{error}</p>
      </main>
    )
  }

  return (
    <LoadingScreen
      facts={facts}
      message="Loading your game..."
    />
  )
}