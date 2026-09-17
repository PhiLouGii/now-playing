import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
    <div className="build-game-page">
      <div className="build-game-page__container">
        <header className="build-game-page__header">
          <p className="label">
            CUSTOM GAME
          </p>

          <h1 className="display-lg">
            Build Your Game.
          </h1>

          <p>
            Make the round exactly how you
            want it.
          </p>
        </header>

        <section className="build-game">
          <div className="build-game__section">
            <div className="build-game__section-header">
              <p className="label">
                01
              </p>

              <h2>
                What do you want to guess?
              </h2>
            </div>

            <div className="build-game__options">
              {questionTypes.map(
                (option) => (
                  <button
                    key={option.type}
                    type="button"
                    className={
                      questionType ===
                      option.type
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
                ),
              )}
            </div>
          </div>

          <div className="build-game__section">
            <div className="build-game__section-header">
              <p className="label">
                02
              </p>

              <h2>
                What era?
              </h2>
            </div>

            <div className="build-game__options build-game__options--eras">
              {eras.map(
                (era) => {
                  const isSelected =
                    decade ===
                    era.decade

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
                },
              )}
            </div>
          </div>

          <div className="build-game__section">
            <div className="build-game__section-header">
              <p className="label">
                03
              </p>

              <h2>
                Difficulty
              </h2>
            </div>

            <div className="build-game__options">
              {difficulties.map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    className={
                      difficulty ===
                      option
                        ? 'is-selected'
                        : ''
                    }
                    onClick={() =>
                      setDifficulty(
                        option,
                      )
                    }
                  >
                    {option
                      .charAt(0)
                      .toUpperCase() +
                      option.slice(1)}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="build-game__section">
            <div className="build-game__section-header">
              <p className="label">
                04
              </p>

              <h2>
                How long?
              </h2>
            </div>

            <div className="build-game__options">
              {questionCounts.map(
                (count) => (
                  <button
                    key={count}
                    type="button"
                    className={
                      questionCount ===
                      count
                        ? 'is-selected'
                        : ''
                    }
                    onClick={() =>
                      setQuestionCount(
                        count,
                      )
                    }
                  >
                    {count}{' '}
                    {count === 1
                      ? 'Song'
                      : 'Songs'}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="build-game__start">
            <button
              type="button"
              onClick={
                handleStartGame
              }
            >
              Start Game
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default BuildGame