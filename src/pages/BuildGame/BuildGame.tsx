import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Disc3,
  Headphones,
  Music2,
  Sparkles,
  Star,
} from 'lucide-react'

import type {
  QuestionDifficulty,
  QuestionType,
  RoundConfig,
} from '../../types/game'

import './BuildGame.css'

type BuildQuestionType = QuestionType | 'mixed'

type EraOption = {
  label: string
  decade?: number
}

const questionTypes: {
  label: string
  type: BuildQuestionType
}[] = [
  {
    label: 'Name That Song',
    type: 'name-the-song',
  },
  {
    label: 'Name the Artist',
    type: 'name-the-artist',
  },
  {
    label: 'Name the Album',
    type: 'name-the-album',
  },
  {
    label: 'Guess the Year',
    type: 'guess-the-year',
  },
  {
    label: 'Mixed',
    type: 'mixed',
  },
]

const eras: EraOption[] = [
  {
    label: 'Any Era',
  },
  {
    label: '60s',
    decade: 1960,
  },
  {
    label: '70s',
    decade: 1970,
  },
  {
    label: '80s',
    decade: 1980,
  },
  {
    label: '90s',
    decade: 1990,
  },
  {
    label: '2000s',
    decade: 2000,
  },
  {
    label: '2010s',
    decade: 2010,
  },
  {
    label: '2020s',
    decade: 2020,
  },
]

const difficulties: QuestionDifficulty[] = [
  'easy',
  'medium',
  'hard',
]

const questionCounts = [
  5,
  10,
  15,
  20,
]

function BuildGame() {
  const navigate = useNavigate()

  const [questionType, setQuestionType] =
    useState<BuildQuestionType>(
      'name-the-song',
    )

  const [decade, setDecade] =
    useState<number | undefined>(
      undefined,
    )

  const [difficulty, setDifficulty] =
    useState<QuestionDifficulty>(
      'medium',
    )

  const [questionCount, setQuestionCount] =
    useState(10)

  function handleStartGame() {
    const questionTypes: QuestionType[] =
      questionType === 'mixed'
        ? [
            'name-the-song',
            'name-the-artist',
            'name-the-album',
            'guess-the-year',
          ]
        : [questionType]

    const roundConfig: RoundConfig = {
      id: `custom-${Date.now()}`,
      name: 'Custom Game',
      questionCount,
      questionTypes,
      difficulty,
      decade,
    }

    navigate('/game', {
      state: {
        roundConfig,
      },
    })
  }

  return (
    <main className="build-game-page">
      <div className="build-game-page__container">

        <header className="build-game-page__header">
          <div className="build-game-page__header-copy">
            <p className="label">
              CUSTOM GAME
            </p>

            <h1 className="display-lg">
              Build Your Game.
            </h1>

            <p>
              Pick your rules, mix it up,
              and make the round yours.
            </p>
          </div>

          <div
            className="build-game-page__header-doodle"
            aria-hidden="true"
          >
            <Disc3 size={54} strokeWidth={1.2} />
          </div>
        </header>

        <section className="build-map">

          {/* Doodles */}
          <div
            className="build-doodle build-doodle--star"
            aria-hidden="true"
          >
            <Star size={20} />
          </div>

          <div
            className="build-doodle build-doodle--sparkle"
            aria-hidden="true"
          >
            <Sparkles size={22} />
          </div>

          <div
            className="build-doodle build-doodle--note"
            aria-hidden="true"
          >
            ♪
          </div>

          <div
            className="build-doodle build-doodle--small-note"
            aria-hidden="true"
          >
            ♫
          </div>

          {/* Hand-drawn connecting lines */}
          <svg
            className="build-map__connections"
            viewBox="0 0 1000 760"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M 380 330 C 300 270, 270 220, 250 155"
            />

            <path
              d="M 620 330 C 700 270, 730 220, 750 155"
            />

            <path
              d="M 380 430 C 300 485, 275 540, 250 610"
            />

            <path
              d="M 620 430 C 700 485, 725 540, 750 610"
            />
          </svg>

          {/* Question type */}
          <div className="build-node build-node--question">
            <div className="build-node__heading">
              <span className="build-node__number">
                01
              </span>

              <Music2 size={17} />
            </div>

            <h2>
              What do you
              <span>want to guess?</span>
            </h2>

            <div className="build-node__options">
              {questionTypes.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  className={
                    questionType === option.type
                      ? 'is-selected'
                      : ''
                  }
                  onClick={() =>
                    setQuestionType(
                      option.type,
                    )
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Era */}
          <div className="build-node build-node--era">
            <div className="build-node__heading">
              <span className="build-node__number">
                02
              </span>

              <Disc3 size={17} />
            </div>

            <h2>
              Pick an
              <span>era.</span>
            </h2>

            <div className="build-node__options build-node__options--era">
              {eras.map((era) => {
                const isSelected =
                  decade === era.decade

                return (
                  <button
                    key={era.label}
                    type="button"
                    className={
                      isSelected
                        ? 'is-selected'
                        : ''
                    }
                    onClick={() =>
                      setDecade(
                        era.decade,
                      )
                    }
                  >
                    {era.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Centre */}
          <div className="build-center">
            <div className="build-center__record">
              <Disc3
                size={48}
                strokeWidth={1.2}
              />
            </div>

            <p className="label">
              YOUR MIX
            </p>

            <h2>
              Build Your
              <span>Game</span>
            </h2>

            <p className="build-center__hint">
              Choose your settings
            </p>
          </div>

          {/* Difficulty */}
          <div className="build-node build-node--difficulty">
            <div className="build-node__heading">
              <span className="build-node__number">
                03
              </span>

              <Sparkles size={17} />
            </div>

            <h2>
              How hard
              <span>should it be?</span>
            </h2>

            <div className="build-node__options">
              {difficulties.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={
                    difficulty === option
                      ? 'is-selected'
                      : ''
                  }
                  onClick={() =>
                    setDifficulty(option)
                  }
                >
                  {option
                    .charAt(0)
                    .toUpperCase() +
                    option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div className="build-node build-node--length">
            <div className="build-node__heading">
              <span className="build-node__number">
                04
              </span>

              <Headphones size={17} />
            </div>

            <h2>
              How long
              <span>is the game?</span>
            </h2>

            <div className="build-node__options">
              {questionCounts.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={
                    questionCount === count
                      ? 'is-selected'
                      : ''
                  }
                  onClick={() =>
                    setQuestionCount(count)
                  }
                >
                  {count} Songs
                </button>
              ))}
            </div>
          </div>

          {/* Start */}
          <div className="build-start">
            <button
              type="button"
              onClick={handleStartGame}
            >
              <span>Start My Game</span>
              <span className="build-start__arrow">
                →
              </span>
            </button>
          </div>

        </section>
      </div>
    </main>
  )
}

export default BuildGame