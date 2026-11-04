
import {
  Disc3,
  Flame,
  Trophy,
  Gamepad2,
  Palette,
  Users,
  Lock,
  LogOut,
  Music2,
  Clock3,
} from 'lucide-react'

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

import {
  getUserScores,
  getUserStats,
  type UserScore,
  type UserStats,
} from '../../services/userService'

import './Profile.css'

const GAME_MODE_LABELS: Record<string, string> = {
  'name-that-song': 'Name That Song',
  'name-the-artist': 'Name the Artist',
  'name-the-album': 'Name the Album',
  'guess-the-year': 'Guess the Year',
  'pixel-cover': 'Pixel Cover',
}

function Profile() {
  const navigate = useNavigate()

  const {
    user,
    profile,
    loading: authLoading,
    logout,
  } = useAuth()

  const [stats, setStats] = useState<UserStats | null>(null)
  const [scores, setScores] = useState<UserScore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

        const [userStats, userScores] = await Promise.all([
          getUserStats(),
          getUserScores(),
        ])

        setStats(userStats)
        setScores(userScores)
      } catch (error) {
        console.error('FAILED TO LOAD PROFILE DATA:', error)
        setError('Failed to load your profile data.')
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      loadProfileData()
    }
  }, [user, authLoading])

  async function handleLogout() {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  function formatDate(completedAt: UserScore['completedAt']) {
    const date = new Date(completedAt._seconds * 1000)

    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (authLoading || isLoading) {
    return (
      <main className="profile-page">
        <div className="profile-loading">
          <Disc3 size={32} />
          <p>Getting your profile ready...</p>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="profile-page">
        <div className="profile-empty">
          <Disc3 size={42} />
          <p className="label">YOUR PLAYER PROFILE</p>
          <h1>Every great player has a record.</h1>
          <p>Sign in to see your games, personal bests and progress.</p>
          <button onClick={() => navigate('/login')}>
            Log in to continue
          </button>
        </div>
      </main>
    )
  }

  if (error || !stats) {
    return (
      <main className="profile-page">
        <div className="profile-loading">
          <p>{error || 'Unable to load your profile.'}</p>
        </div>
      </main>
    )
  }

  const displayName =
    profile?.displayName ||
    profile?.username ||
    user.displayName ||
    'Player'

  const username = profile?.username || 'player'

  const personalBests = [
    {
      number: '01',
      name: 'Name That Song',
      score: stats.personalBests.nameThatSong,
    },
    {
      number: '02',
      name: 'Name the Artist',
      score: stats.personalBests.nameTheArtist,
    },
    {
      number: '03',
      name: 'Name the Album',
      score: stats.personalBests.nameTheAlbum,
    },
    {
      number: '04',
      name: 'Guess the Year',
      score: stats.personalBests.guessTheYear,
    },
    {
      number: '05',
      name: 'Pixel Cover',
      score: stats.personalBests.pixelCover,
    },
  ]

  return (
    <main className="profile-page">
      <div className="profile-page__container">

        {/* PLAYER HEADER */}

        <header className="profile-header">
          <div className="profile-avatar">
            <Disc3 size={38} strokeWidth={1.4} />
          </div>

          <div className="profile-identity">
            <span className="profile-eyebrow">PLAYER PROFILE</span>

            <h1>{displayName}</h1>

            <p>@{username}</p>
          </div>

          <div className="profile-header__actions">
            <span className="profile-player-tag">
              <span className="profile-status-dot" />
              NOW PLAYING PLAYER
            </span>

            <button
              className="profile-logout"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* PLAYER STATS */}

        <section className="profile-stats">
          <div className="profile-stat">
            <span>GAMES PLAYED</span>
            <strong>{stats.gamesPlayed}</strong>
          </div>

          <div className="profile-stat">
            <span>TOTAL POINTS</span>
            <strong>{stats.totalPoints.toLocaleString()}</strong>
          </div>

          <div className="profile-stat">
            <span>AVERAGE ACCURACY</span>
            <strong>{stats.averageAccuracy}%</strong>
          </div>

          <div className="profile-stat">
            <span>BEST STREAK</span>
            <strong className="profile-streak">
              <Flame size={18} />
              {stats.bestStreak}
            </strong>
          </div>
        </section>

        {/* MAIN PROFILE CONTENT */}

        <div className="profile-content">

          {/* LEFT COLUMN */}

          <div className="profile-column">

            {/* PERSONAL BESTS */}

            <section className="profile-card">
              <div className="profile-section-header">
                <div>
                  <span className="profile-eyebrow">YOUR RECORD</span>
                  <h2>Personal bests</h2>
                </div>

                <Trophy size={21} />
              </div>

              <div className="personal-bests">
                {personalBests.map((best) => (
                  <div className="personal-best" key={best.number}>
                    <span className="personal-best__number">
                      {best.number}
                    </span>

                    <span className="personal-best__name">
                      {best.name}
                    </span>

                    <strong>
                      {best.score ?? '—'}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="profile-correct">
                <div>
                  <span>TOTAL CORRECT ANSWERS</span>
                  <strong>
                    {stats.totalCorrectAnswers.toLocaleString()}
                  </strong>
                </div>

                <Disc3 size={27} />
              </div>
            </section>

            {/* RECENT ACTIVITY */}

            <section className="profile-card">
              <div className="profile-section-header">
                <div>
                  <span className="profile-eyebrow">YOUR ACTIVITY</span>
                  <h2>Recently played</h2>
                </div>

                <Clock3 size={20} />
              </div>

              {scores.length === 0 ? (
                <div className="profile-history-empty">
                  <Music2 size={25} />
                  <p>No games played yet.</p>
                  <span>Your next high score starts here.</span>
                </div>
              ) : (
                <div className="score-history">
                  {scores.slice(0, 5).map((game) => (
                    <div
                      key={game.id}
                      className="score-history-entry"
                    >
                      <div className="score-history__icon">
                        <Disc3 size={17} />
                      </div>

                      <div className="score-history-main">
                        <strong>
                          {GAME_MODE_LABELS[game.gameMode] ||
                            game.gameMode}
                        </strong>

                        <span>{formatDate(game.completedAt)}</span>
                      </div>

                      <div className="score-history-score">
                        <strong>
                          {game.score.toLocaleString()}
                        </strong>
                        <span>POINTS</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN */}

          <div className="profile-column">

            {/* PLAYER OVERVIEW */}

            <section className="profile-card profile-overview">
              <div className="profile-section-header">
                <div>
                  <span className="profile-eyebrow">THE PLAYER</span>
                  <h2>Your music journey</h2>
                </div>

                <Gamepad2 size={21} />
              </div>

              <p>
                Every round played adds to your record.
                Keep discovering music, improving your scores
                and building your reputation.
              </p>

              <div className="profile-overview__footer">
                <span>KEEP THE MUSIC GOING.</span>
                <Disc3 size={20} />
              </div>
            </section>

            {/* COMING SOON FEATURES */}

            <section className="profile-card">
              <div className="profile-section-header">
                <div>
                  <span className="profile-eyebrow">COMING IN FUTURE PHASES</span>
                  <h2>Make it yours</h2>
                </div>
              </div>

              <div className="profile-locked-features">

                <div
                  className="profile-feature profile-feature--locked"
                  title="Customization is planned for a future phase."
                  aria-disabled="true"
                >
                  <div className="profile-feature__icon">
                    <Palette size={19} />
                  </div>

                  <div>
                    <strong>Customization</strong>
                    <span>Avatars, themes and profile details</span>
                  </div>

                  <Lock size={15} className="profile-feature__lock" />
                </div>

                <div
                  className="profile-feature profile-feature--locked"
                  title="Community features are planned for a future phase."
                  aria-disabled="true"
                >
                  <div className="profile-feature__icon">
                    <Users size={19} />
                  </div>

                  <div>
                    <strong>Community</strong>
                    <span>Friends, challenges and multiplayer</span>
                  </div>

                  <Lock size={15} className="profile-feature__lock" />
                </div>

              </div>
            </section>

            {/* ACCOUNT */}

            <section className="profile-card profile-account">
              <div className="profile-section-header">
                <div>
                  <span className="profile-eyebrow">ACCOUNT</span>
                  <h2>Player details</h2>
                </div>

                <UserIcon />
              </div>

              <div className="profile-account__details">
                <div>
                  <span>DISPLAY NAME</span>
                  <strong>{displayName}</strong>
                </div>

                <div>
                  <span>EMAIL ADDRESS</span>
                  <strong>{user.email || 'Not available'}</strong>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </main>
  )
}

function UserIcon() {
  return <Disc3 size={20} />
}

export default Profile
