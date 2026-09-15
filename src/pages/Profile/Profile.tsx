import { useEffect, useState } from 'react'

import { useAuth } from '../../context/AuthContext'
import {
  getUserStats,
  type UserStats,
} from '../../services/userService'

import './Profile.css'

function Profile() {
  const {
    user,
    profile,
    loading: authLoading,
  } = useAuth()

  const [stats, setStats] =
    useState<UserStats | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      if (!user) {
        setStats(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const userStats =
          await getUserStats()

        setStats(userStats)
      } catch (error) {
        console.error(
          'FAILED TO LOAD USER STATS:',
          error,
        )

        setError(
          'Failed to load your stats.',
        )
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading) {
      loadStats()
    }
  }, [user, authLoading])

  if (authLoading || isLoading) {
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
    </section>
  )
}

export default Profile