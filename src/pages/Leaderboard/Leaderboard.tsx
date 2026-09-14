import { useEffect, useState } from 'react'

import {
  getLeaderboard,
  type LeaderboardEntry,
} from '../../services/leaderboardService'

import './Leaderboard.css'

function Leaderboard() {
  const [entries, setEntries] =
    useState<LeaderboardEntry[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setIsLoading(true)
        setError(null)

        const leaderboard =
          await getLeaderboard()

        setEntries(leaderboard)
      } catch (error) {
        console.error(
          'FAILED TO LOAD LEADERBOARD:',
          error,
        )

        setError(
          'Failed to load leaderboard.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaderboard()
  }, [])

  if (isLoading) {
    return (
      <section className="placeholder-page">
        <p className="label">
          LEADERBOARD
        </p>

        <h1 className="display-lg">
          See who knows music.
        </h1>

        <p className="body-lg">
          Loading rankings...
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="placeholder-page">
        <p className="label">
          LEADERBOARD
        </p>

        <h1 className="display-lg">
          Something went wrong.
        </h1>

        <p className="body-lg">
          {error}
        </p>
      </section>
    )
  }

  return (
    <section className="leaderboard-page">
      <p className="label">
        LEADERBOARD
      </p>

      <h1 className="display-lg">
        See who knows music.
      </h1>

      {entries.length === 0 ? (
        <p className="body-lg">
          No scores yet. Be the first to
          play!
        </p>
      ) : (
        <div className="leaderboard-list">
          {entries.map((entry) => (
            <div
              key={`${entry.rank}-${entry.username}-${entry.score}`}
              className="leaderboard-entry"
            >
              <span className="leaderboard-rank">
                #{entry.rank}
              </span>

              <div className="leaderboard-player">
                <strong>
                  {entry.displayName}
                </strong>

                <span>
                  @{entry.username}
                </span>
              </div>

              <div className="leaderboard-score">
                <strong>
                  {entry.score}
                </strong>

                <span>points</span>
              </div>

              <div className="leaderboard-stats">
                <span>
                  {entry.accuracy}% accuracy
                </span>

                <span>
                  🔥 {entry.bestStreak}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default Leaderboard