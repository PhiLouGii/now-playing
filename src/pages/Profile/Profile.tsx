import {
  Disc3,
  Flame,
  Trophy,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAuth } from '../../context/AuthContext'

import {
  getUserScores,
  getUserStats,
  type UserScore,
  type UserStats,
} from '../../services/userService'

import './Profile.css'

const GAME_MODE_LABELS = {
  'name-that-song': 'Name That Song',
  'name-the-artist': 'Name the Artist',
  'name-the-album': 'Name the Album',
  'guess-the-year': 'Guess the Year',
  'daily-challenge': 'Daily Challenge',
}

function Profile() {
  const {
    user,
    profile,
    loading: authLoading,
  } = useAuth()

  const [stats, setStats] =
    useState<UserStats | null>(null)

  const [scores, setScores] =
    useState<UserScore[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    async function loadProfileData() {
      if (!user) {
        setStats(null)
        setScores([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const [
          userStats,
          userScores,
        ] = await Promise.all([
          getUserStats(),
          getUserScores(),
        ])

        setStats(userStats)
        setScores(userScores)
      } catch (error) {
        console.error(
          'FAILED TO LOAD PROFILE DATA:',
          error,
        )

        setError(
          'Failed to load your profile data.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      loadProfileData()
    }
  }, [user, authLoading])

  if (authLoading || isLoading) {
    return (
      <main className="profile-page">
        <div className="profile-page__container">
          <p className="label">PROFILE</p>

          <h1 className="display-lg">
            Your music knowledge.
          </h1>

          <p className="body-lg">
            Loading your stats...
          </p>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="profile-page">
        <div className="profile-page__container">
          <p className="label">PROFILE</p>

          <h1 className="display-lg">
            Sign in to see your stats.
          </h1>

          <p className="body-lg">
            Your games, scores, and personal
            bests will appear here.
          </p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="profile-page">
        <div className="profile-page__container">
          <p className="label">PROFILE</p>

          <h1 className="display-lg">
            Something went wrong.
          </h1>

          <p className="body-lg">
            {error}
          </p>
        </div>
      </main>
    )
  }

  if (!stats) {
    return null
  }

  function formatDate(
    completedAt: UserScore['completedAt'],
  ) {
    const date = new Date(
      completedAt._seconds * 1000,
    )

    return date.toLocaleDateString(
      undefined,
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      },
    )
  }

  const displayName =
    profile?.displayName ||
    profile?.username ||
    user.email ||
    'Player'

  return (
    <main className="profile-page">
      <div className="profile-page__container">

        {/* Profile identity */}

        <header className="profile-header">
          <div className="profile-header__record">
            <Disc3
              size={34}
              strokeWidth={1.4}
            />
          </div>

          <div className="profile-header__identity">
            <p className="label">
              PROFILE
            </p>

            <h1 className="display-lg">
              {displayName}
            </h1>

            {profile?.username && (
              <p className="profile-username">
                @{profile.username}
              </p>
            )}
          </div>

          <div className="profile-header__tag">
            <span>NOW PLAYING</span>
            <strong>PLAYER PROFILE</strong>
          </div>
        </header>

        {/* Main stats */}

        <section className="profile-stats">
          <div className="profile-stat">
            <span>GAMES PLAYED</span>

            <strong>
              {stats.gamesPlayed}
            </strong>
          </div>

          <div className="profile-stat">
            <span>TOTAL POINTS</span>

            <strong>
              {stats.totalPoints.toLocaleString()}
            </strong>
          </div>

          <div className="profile-stat">
            <span>AVERAGE ACCURACY</span>

            <strong>
              {stats.averageAccuracy}%
            </strong>
          </div>

          <div className="profile-stat">
            <span>BEST STREAK</span>

            <strong className="profile-stat__streak">
              <Flame
                size={18}
                strokeWidth={1.8}
              />
              {stats.bestStreak}
            </strong>
          </div>
        </section>

        <div className="profile-content">

          {/* Personal bests */}

          <section className="profile-section profile-section--bests">
            <div className="profile-section__header">
              <div>
                <p className="label">
                  PERSONAL BESTS
                </p>

                <h2>
                  Your top scores.
                </h2>
              </div>

              <Trophy
                size={22}
                strokeWidth={1.5}
              />
            </div>

            <div className="personal-bests">
              <div className="personal-best">
                <span className="personal-best__number">
                  01
                </span>

                <span className="personal-best__name">
                  Name That Song
                </span>

                <strong>
                  {stats.personalBests
                    .nameThatSong ?? '—'}
                </strong>
              </div>

              <div className="personal-best">
                <span className="personal-best__number">
                  02
                </span>

                <span className="personal-best__name">
                  Name the Artist
                </span>

                <strong>
                  {stats.personalBests
                    .nameTheArtist ?? '—'}
                </strong>
              </div>

              <div className="personal-best">
                <span className="personal-best__number">
                  03
                </span>

                <span className="personal-best__name">
                  Name the Album
                </span>

                <strong>
                  {stats.personalBests
                    .nameTheAlbum ?? '—'}
                </strong>
              </div>

              <div className="personal-best">
                <span className="personal-best__number">
                  04
                </span>

                <span className="personal-best__name">
                  Guess the Year
                </span>

                <strong>
                  {stats.personalBests
                    .guessTheYear ?? '—'}
                </strong>
              </div>

              <div className="personal-best">
                <span className="personal-best__number">
                  05
                </span>

                <span className="personal-best__name">
                  Daily Challenge
                </span>

                <strong>
                  {stats.personalBests
                    .dailyChallenge ?? '—'}
                </strong>
              </div>
            </div>

            <div className="profile-correct">
              <div>
                <span>
                  TOTAL CORRECT ANSWERS
                </span>

                <strong>
                  {stats.totalCorrectAnswers.toLocaleString()}
                </strong>
              </div>

              <Disc3
                size={30}
                strokeWidth={1.3}
              />
            </div>
          </section>

          {/* Recent games */}

          <section className="profile-section profile-section--history">
            <div className="profile-section__header">
              <div>
                <p className="label">
                  RECENT GAMES
                </p>

                <h2>
                  Your play history.
                </h2>
              </div>
            </div>

            {scores.length === 0 ? (
              <div className="score-history__empty">
                <Disc3 size={28} />

                <p>
                  You haven't played any games yet.
                </p>
              </div>
            ) : (
              <div className="score-history">
                {scores.map((game) => (
                  <div
                    key={game.id}
                    className="score-history-entry"
                  >
                    <div className="score-history__icon">
                      <Disc3
                        size={18}
                        strokeWidth={1.5}
                      />
                    </div>

                    <div className="score-history-main">
                      <strong>
                        {
                          GAME_MODE_LABELS[
                            game.gameMode
                          ]
                        }
                      </strong>

                      <span>
                        {formatDate(
                          game.completedAt,
                        )}
                      </span>
                    </div>

                    <div className="score-history-score">
                      <strong>
                        {game.score.toLocaleString()}
                      </strong>

                      <span>
                        POINTS
                      </span>
                    </div>

                    <div className="score-history-stats">
                      <span>
                        {game.accuracy}% accuracy
                      </span>

                      <span className="score-history-streak">
                        <Flame
                          size={13}
                          strokeWidth={1.8}
                        />
                        {game.bestStreak}
                      </span>

                      <span>
                        {game.correctAnswers}/
                        {game.questions}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  )
}

export default Profile