import { Flame, Disc3 } from 'lucide-react'
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
    useState<CurrentUserLeaderboard | null>(null)

  const [selectedMode, setSelectedMode] =
    useState<LeaderboardGameMode | undefined>(
      undefined,
    )

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setIsLoading(true)
        setError(null)

        const result = await getLeaderboard(
          selectedMode,
        )

        setEntries(result.leaderboard)
        setCurrentUser(result.currentUser)
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
      <main className="leaderboard-page">
        <div className="leaderboard-page__container">
          <header className="leaderboard-header">
            <p className="label">
              LEADERBOARD
            </p>

            <h1 className="display-lg">
              See who knows music.
            </h1>

            <p className="leaderboard-header__intro">
              Loading the latest rankings...
            </p>
          </header>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="leaderboard-page">
        <div className="leaderboard-page__container">
          <header className="leaderboard-header">
            <p className="label">
              LEADERBOARD
            </p>

            <h1 className="display-lg">
              Something went wrong.
            </h1>

            <p className="leaderboard-header__intro">
              {error}
            </p>
          </header>
        </div>
      </main>
    )
  }

  return (
    <main className="leaderboard-page">
      <div className="leaderboard-page__container">
        <header className="leaderboard-header">
          <div>
            <p className="label">
              LEADERBOARD
            </p>

            <h1 className="display-lg">
              See who knows music.
            </h1>
          </div>

          <p className="leaderboard-header__intro">
            Climb the chart, build your streak,
            and see where you stand.
          </p>
        </header>

        <div className="leaderboard-filter">
          <div className="leaderboard-filter__label">
            <span>CHART</span>
            <span>SELECT MODE</span>
          </div>

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
        </div>

        {currentUser && (
          <section className="leaderboard-your-rank">
            <div className="leaderboard-your-rank__identity">
              <div className="leaderboard-your-rank__record">
                <Disc3
                  size={22}
                  strokeWidth={1.5}
                />
              </div>

              <div>
                <span className="leaderboard-your-rank__label">
                  YOUR POSITION
                </span>

                <strong>
                  {currentUser.rank !== null
                    ? `#${currentUser.rank}`
                    : 'Unranked'}
                </strong>
              </div>
            </div>

            <div className="leaderboard-your-rank__score">
              <span>
                BEST SCORE
              </span>

              <strong>
                {currentUser.score !== null
                  ? currentUser.score.toLocaleString()
                  : '—'}
              </strong>

              {currentUser.score !== null && (
                <small>POINTS</small>
              )}
            </div>
          </section>
        )}

        <section className="leaderboard-chart">
          <div className="leaderboard-chart__header">
            <div>
              <p className="label">
                MUSIC CHART
              </p>

              <h2>
                Top players
              </h2>
            </div>

            <span>
              {selectedMode
                ? GAME_MODES.find(
                    (mode) =>
                      mode.value ===
                      selectedMode,
                  )?.label
                : 'All Time'}
            </span>
          </div>

          {entries.length === 0 ? (
            <div className="leaderboard-empty">
              <Disc3 size={28} />

              <h3>
                No scores yet.
              </h3>

              <p>
                Be the first player on the chart.
              </p>
            </div>
          ) : (
            <div className="leaderboard-list">
              {entries.map((entry) => (
                <div
                  key={`${entry.rank}-${entry.username}-${entry.score}`}
                  className={`leaderboard-entry ${
                    entry.rank <= 3
                      ? `leaderboard-entry--top-${entry.rank}`
                      : ''
                  }`}
                >
                  <span className="leaderboard-rank">
                    {String(entry.rank).padStart(
                      2,
                      '0',
                    )}
                  </span>

                  <div className="leaderboard-player">
                    <span className="leaderboard-player__record">
                      <Disc3
                        size={17}
                        strokeWidth={1.5}
                      />
                    </span>

                    <div>
                      <strong>
                        {entry.displayName}
                      </strong>

                      <span>
                        @{entry.username}
                      </span>
                    </div>
                  </div>

                  <div className="leaderboard-score">
                    <strong>
                      {entry.score.toLocaleString()}
                    </strong>

                    <span>
                      POINTS
                    </span>
                  </div>

                  <div className="leaderboard-stats">
                    <span>
                      {entry.accuracy}%
                    </span>

                    <span className="leaderboard-streak">
                      <Flame
                        size={14}
                        strokeWidth={1.8}
                      />
                      {entry.bestStreak}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Leaderboard