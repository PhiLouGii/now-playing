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

  if (
    authLoading ||
    isLoading
  ) {
    return (
      <section className="placeholder-page">
        <p className="label">
          PROFILE
        </p>

        <h1 className="display-lg">
          Your music knowledge.
        </h1>

        <p className="body-lg">
          Loading your stats...
        </p>
      </section>
    )
  }

  if (!user) {
    return (
      <section className="placeholder-page">
        <p className="label">
          PROFILE
        </p>

        <h1 className="display-lg">
          Sign in to see your stats.
        </h1>

        <p className="body-lg">
          Your games, scores, and personal
          bests will appear here.
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="placeholder-page">
        <p className="label">
          PROFILE
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

  return (
    <section className="profile-page">
      <div className="profile-header">
        <p className="label">
          PROFILE
        </p>

        <h1 className="display-lg">
          {profile?.displayName ||
            profile?.username ||
            user.email}
        </h1>

        {profile?.username && (
          <p className="profile-username">
            @{profile.username}
          </p>
        )}
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span>Games Played</span>

          <strong>
            {stats.gamesPlayed}
          </strong>
        </div>

        <div className="profile-stat">
          <span>Total Points</span>

          <strong>
            {stats.totalPoints}
          </strong>
        </div>

        <div className="profile-stat">
          <span>Average Accuracy</span>

          <strong>
            {stats.averageAccuracy}%
          </strong>
        </div>

        <div className="profile-stat">
          <span>Best Streak</span>

          <strong>
            🔥 {stats.bestStreak}
          </strong>
        </div>
      </div>

      <div className="profile-section">
        <p className="label">
          PERSONAL BESTS
        </p>

        <div className="personal-bests">
          <div className="personal-best">
            <span>
              Name That Song
            </span>

            <strong>
              {stats.personalBests
                .nameThatSong ??
                '—'}
            </strong>
          </div>

          <div className="personal-best">
            <span>
              Name the Artist
            </span>

            <strong>
              {stats.personalBests
                .nameTheArtist ??
                '—'}
            </strong>
          </div>

          <div className="personal-best">
            <span>
              Name the Album
            </span>

            <strong>
              {stats.personalBests
                .nameTheAlbum ??
                '—'}
            </strong>
          </div>

          <div className="personal-best">
            <span>
              Guess the Year
            </span>

            <strong>
              {stats.personalBests
                .guessTheYear ??
                '—'}
            </strong>
          </div>

          <div className="personal-best">
            <span>
              Daily Challenge
            </span>

            <strong>
              {stats.personalBests
                .dailyChallenge ??
                '—'}
            </strong>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <p className="label">
          TOTAL CORRECT
        </p>

        <strong className="profile-large-stat">
          {stats.totalCorrectAnswers}
        </strong>
      </div>

      <div className="profile-section">
        <p className="label">
          RECENT GAMES
        </p>

        {scores.length === 0 ? (
          <p className="body-lg">
            You haven't played any games yet.
          </p>
        ) : (
          <div className="score-history">
            {scores.map((game) => (
              <div
                key={game.id}
                className="score-history-entry"
              >
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
                    {game.score}
                  </strong>

                  <span>
                    points
                  </span>
                </div>

                <div className="score-history-stats">
                  <span>
                    {game.accuracy}%
                    accuracy
                  </span>

                  <span>
                    🔥 {game.bestStreak}
                  </span>

                  <span>
                    {game.correctAnswers}/
                    {game.questions}
                    {' '}correct
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Profile