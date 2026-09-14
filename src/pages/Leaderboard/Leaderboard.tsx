import { useEffect, useState } from 'react'

import {
  getLeaderboard,
  type CurrentUserLeaderboard,
  type LeaderboardEntry,
  type LeaderboardGameMode,
} from '../../services/leaderboardService'

import './Leaderboard.css'

const GAME_MODES: {
  label: string
  value?: LeaderboardGameMode
}[] = [
  {
    label: 'All Time',
  },
  {
    label: 'Name That Song',
    value: 'name-that-song',
  },
  {
    label: 'Name the Artist',
    value: 'name-the-artist',
  },
  {
    label: 'Name the Album',
    value: 'name-the-album',
  },
  {
    label: 'Guess the Year',
    value: 'guess-the-year',
  },
  {
    label: 'Daily Challenge',
    value: 'daily-challenge',
  },
]

function Leaderboard() {
  const [entries, setEntries] =
    useState<LeaderboardEntry[]>([])

  const [currentUser, setCurrentUser] =
    useState<CurrentUserLeaderboard | null>(
      null,
    )

  const [selectedMode, setSelectedMode] =
    useState<
      LeaderboardGameMode | undefined
    >(undefined)

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setIsLoading(true)
        setError(null)

        const result =
          await getLeaderboard(
            selectedMode,
          )

        setEntries(
          result.leaderboard,
        )

        setCurrentUser(
          result.currentUser,
        )
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
  }, [selectedMode])

  function handleModeChange(
    mode:
      | LeaderboardGameMode
      | undefined,
  ) {
    setSelectedMode(mode)
  }

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

      <div className="leaderboard-modes">
        {GAME_MODES.map((mode) => (
          <button
            key={mode.label}
            type="button"
            className={
              selectedMode === mode.value
                ? 'active'
                : ''
            }
            onClick={() =>
              handleModeChange(
                mode.value,
              )
            }
          >
            {mode.label}
          </button>
        ))}
      </div>

      {currentUser && (
        <div className="leaderboard-your-rank">
          <div>
            <span>Your Rank</span>

            <strong>
              {currentUser.rank !== null
                ? `#${currentUser.rank}`
                : 'Unranked'}
            </strong>
          </div>

          <div>
            <span>Your Best Score</span>

            <strong>
              {currentUser.score !== null
                ? `${currentUser.score} points`
                : 'No score yet'}
            </strong>
          </div>
        </div>
      )}

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