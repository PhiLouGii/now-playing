
import { Disc3, Flame, Crown, Medal, Trophy } from 'lucide-react'
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
  { label: 'All Time' },
  { label: 'Name That Song', value: 'name-that-song' },
  { label: 'Name the Artist', value: 'name-the-artist' },
  { label: 'Name the Album', value: 'name-the-album' },
  { label: 'Guess the Year', value: 'guess-the-year' },
  { label: 'Pixel Cover', value: 'pixel-cover' },
]

function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [currentUser, setCurrentUser] =
    useState<CurrentUserLeaderboard | null>(null)
  const [selectedMode, setSelectedMode] =
    useState<LeaderboardGameMode | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setIsLoading(true)
        setError(null)

        const result = await getLeaderboard(selectedMode)

        setEntries(result.leaderboard)
        setCurrentUser(result.currentUser)
      } catch (error) {
        console.error('FAILED TO LOAD LEADERBOARD:', error)
        setError('Failed to load leaderboard.')
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaderboard()
  }, [selectedMode])

  const sortedEntries = [...entries].sort(
    (a, b) => a.rank - b.rank,
  )

  const podiumEntries = sortedEntries
    .filter((entry) => entry.rank <= 3)
    .sort((a, b) => {
      const order = [2, 1, 3]
      return order.indexOf(a.rank) - order.indexOf(b.rank)
    })

  const remainingEntries = sortedEntries.filter(
    (entry) => entry.rank > 3,
  )

  const selectedLabel =
    GAME_MODES.find((mode) => mode.value === selectedMode)?.label ??
    'All Time'

  return (
    <main className="leaderboard-page">
      <div className="leaderboard-page__container">
        <header className="leaderboard-header">
          <div>
            <p className="label">THE MUSIC ARCADE</p>
            <h1 className="display-lg">The leaderboard.</h1>
          </div>

          <p className="leaderboard-header__intro">
            The players, the points, the bragging rights.
            See who's topping the charts.
          </p>
        </header>

        <section className="leaderboard-filter">
          <div className="leaderboard-filter__label">
            <span>THE CHARTS</span>
            <span>CHOOSE YOUR GAME</span>
          </div>

          <div className="leaderboard-modes">
            {GAME_MODES.map((mode) => (
              <button
                key={mode.label}
                type="button"
                className={selectedMode === mode.value ? 'active' : ''}
                aria-pressed={selectedMode === mode.value}
                onClick={() => setSelectedMode(mode.value)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <div className="leaderboard-state">
            <Disc3 size={32} />
            <h2>Finding the high scorers...</h2>
            <p>Getting the latest music rankings.</p>
          </div>
        ) : error ? (
          <div className="leaderboard-state">
            <Disc3 size={32} />
            <h2>Something went wrong.</h2>
            <p>{error}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="leaderboard-state">
            <Disc3 size={36} />
            <h2>The podium is waiting.</h2>
            <p>Be the first player to make it onto this chart.</p>
          </div>
        ) : (
          <>
            {currentUser && (
              <section className="leaderboard-your-rank">
                <div className="leaderboard-your-rank__identity">
                  <div className="leaderboard-your-rank__record">
                    <Disc3 size={22} />
                  </div>

                  <div>
                    <span>YOUR POSITION</span>
                    <strong>
                      {currentUser.rank !== null
                        ? `#${currentUser.rank}`
                        : 'Unranked'}
                    </strong>
                  </div>
                </div>

                <div className="leaderboard-your-rank__score">
                  <span>YOUR BEST SCORE</span>
                  <strong>
                    {currentUser.score !== null
                      ? currentUser.score.toLocaleString()
                      : '—'}
                  </strong>
                  <small>POINTS</small>
                </div>
              </section>
            )}

            <section className="leaderboard-podium-section">
              <div className="leaderboard-section-heading">
                <div>
                  <p className="label">THE HALL OF FAME</p>
                  <h2>Top players</h2>
                </div>

                <span>{selectedLabel}</span>
              </div>

              <div className="leaderboard-podium">
                {podiumEntries.map((entry) => (
                  <article
                    key={`${entry.rank}-${entry.username}`}
                    className={`podium-card podium-card--${entry.rank}`}
                  >
                    <div className="podium-card__crown">
                      {entry.rank === 1 ? (
                        <Crown size={25} />
                      ) : entry.rank === 2 ? (
                        <Medal size={23} />
                      ) : (
                        <Trophy size={22} />
                      )}
                    </div>

                    <span className="podium-card__position">
                      {entry.rank === 1
                        ? '1ST PLACE'
                        : entry.rank === 2
                          ? '2ND PLACE'
                          : '3RD PLACE'}
                    </span>

                    <div className="podium-card__record">
                      <Disc3 size={30} strokeWidth={1.4} />
                    </div>

                    <strong className="podium-card__name">
                      {entry.displayName}
                    </strong>

                    <span className="podium-card__username">
                      @{entry.username}
                    </span>

                    <div className="podium-card__score">
                      {entry.score.toLocaleString()}
                      <small>PTS</small>
                    </div>

                    <div className="podium-card__base">
                      <span>{entry.rank}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {remainingEntries.length > 0 && (
              <section className="leaderboard-chart">
                <div className="leaderboard-chart__header">
                  <div>
                    <p className="label">THE REST OF THE CHART</p>
                    <h2>Climbing the ranks</h2>
                  </div>

                  <span>{remainingEntries.length} PLAYERS</span>
                </div>

                <div className="leaderboard-list">
                  {remainingEntries.map((entry) => (
                    <div
                      key={`${entry.rank}-${entry.username}`}
                      className="leaderboard-entry"
                    >
                      <span className="leaderboard-rank">
                        {String(entry.rank).padStart(2, '0')}
                      </span>

                      <div className="leaderboard-player">
                        <span className="leaderboard-player__record">
                          <Disc3 size={17} />
                        </span>

                        <div>
                          <strong>{entry.displayName}</strong>
                          <span>@{entry.username}</span>
                        </div>
                      </div>

                      <div className="leaderboard-score">
                        <strong>{entry.score.toLocaleString()}</strong>
                        <span>POINTS</span>
                      </div>

                      <div className="leaderboard-stats">
                        <span>{entry.accuracy}%</span>
                        <span className="leaderboard-streak">
                          <Flame size={14} />
                          {entry.bestStreak}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default Leaderboard
