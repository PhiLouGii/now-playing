import { useEffect, useRef, useState } from 'react'
import { Dices } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import './PlayByCategory.css'

type Category = {
  id: string
  name: string
  description: string
  type: 'genre' | 'group' | 'artist' | 'themed'
}

const categories: Category[] = [
  {
    id: 'african',
    name: 'All Things African',
    description: 'Afrobeats · Amapiano · Legends',
    type: 'genre',
  },
  {
    id: 'kpop',
    name: 'K-Pop',
    description: 'EXO · MONSTA X · GOT7',
    type: 'genre',
  },
  {
    id: 'disney-nick',
    name: 'Disney & Nick Throwbacks',
    description: 'Hannah Montana · iCarly · A.N.T. Farm',
    type: 'themed',
  },
  {
    id: 'girl-groups',
    name: 'Girl Groups',
    description: 'Spice Girls · Little Mix · Pussycat Dolls',
    type: 'group',
  },
  {
    id: 'boy-bands',
    name: 'Boy Bands',
    description: 'One Direction · NSYNC · Why Don’t We',
    type: 'group',
  },
  {
    id: 'indie-alt',
    name: 'Indie & Alt',
    description: 'Yeah Yeah Yeahs · Tame Impala · MGMT',
    type: 'genre',
  },
  {
    id: 'michael-jackson',
    name: 'Michael Jackson',
    description: 'The Jackson 5 · The Jacksons · Solo',
    type: 'artist',
  },
  {
    id: 'beyonce',
    name: 'Beyoncé',
    description: 'Destiny’s Child · Solo · The Carters',
    type: 'artist',
  },
  {
    id: 'queen',
    name: 'Queen',
    description: 'Killer · Champions · Radio Ga Ga',
    type: 'artist',
  },
  {
    id: 'ariana-grande',
    name: 'Ariana Grande',
    description: 'Yours Truly · Petal · Sweetener',
    type: 'artist',
  },
]

function PlayByCategory() {
  const navigate = useNavigate()

  const [activeIndex, setActiveIndex] =
    useState(0)

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null)

  const [isSpinning, setIsSpinning] =
    useState(false)

  const spinTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    )

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        clearTimeout(
          spinTimeoutRef.current,
        )
      }
    }
  }, [])

  function handleSpin() {
    if (isSpinning) return

    setIsSpinning(true)

    const finalIndex = Math.floor(
      Math.random() * categories.length,
    )

    let currentIndex = activeIndex
    let step = 0

    const totalSteps =
      18 + Math.floor(Math.random() * 8)

    function advance() {
      step += 1

      currentIndex =
        (currentIndex + 1) %
        categories.length

      setActiveIndex(currentIndex)

      if (step < totalSteps) {
        const progress =
          step / totalSteps

        const delay =
          progress < 0.65
            ? 55
            : progress < 0.85
              ? 100
              : 180

        spinTimeoutRef.current =
          setTimeout(
            advance,
            delay,
          )
      } else {
        setActiveIndex(finalIndex)

        spinTimeoutRef.current =
          setTimeout(() => {
            setIsSpinning(false)
            setSelectedCategory(
              categories[finalIndex],
            )
          }, 350)
      }
    }

    advance()
  }

  function handleCloseModal() {
    setSelectedCategory(null)
  }

  function handlePlayCategory() {
    if (!selectedCategory) return

    navigate(
      `/game?category=${encodeURIComponent(
        selectedCategory.id,
      )}`,
    )
  }

  return (
    <>
      <section className="categories">
        <div className="categories__container">
          <div className="categories__header">
            <div>
              <p className="label">
                PLAY BY CATEGORY
              </p>

              <h2 className="heading-lg">
                Let fate pick your sound.
              </h2>
            </div>

            <span className="categories__count">
              {String(
                activeIndex + 1,
              ).padStart(2, '0')}
              {' / '}
              {String(
                categories.length,
              ).padStart(2, '0')}
            </span>
          </div>

          <div
            className={`category-spinner ${
              isSpinning
                ? 'category-spinner--spinning'
                : ''
            }`}
          >
            <div className="category-spinner__window">
              <span className="category-spinner__number">
                {String(
                  activeIndex + 1,
                ).padStart(2, '0')}
              </span>

              <span className="category-spinner__name">
                {
                  categories[
                    activeIndex
                  ].name
                }
              </span>

              <span className="category-spinner__status">
                {isSpinning
                  ? 'SPINNING...'
                  : 'READY'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="category-spin-button"
            onClick={handleSpin}
            disabled={isSpinning}
          >
            <Dices
              size={17}
              strokeWidth={1.8}
            />

            <span>
              {isSpinning
                ? 'SPINNING'
                : 'SPIN THE CATEGORIES'}
            </span>
          </button>
        </div>
      </section>

      {selectedCategory && (
        <div
          className="category-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
          onClick={handleCloseModal}
        >
          <div
            className="category-modal__content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <span className="category-modal__label">
              CATEGORY SELECTED
            </span>

            <h2
              id="category-modal-title"
              className="category-modal__title"
            >
              {selectedCategory.name}
            </h2>

            <p className="category-modal__description">
              {selectedCategory.description}
            </p>

            <p className="category-modal__prompt">
              Ready to test yourself?
            </p>

            <div className="category-modal__actions">
              <button
                type="button"
                className="category-modal__play"
                onClick={
                  handlePlayCategory
                }
              >
                PLAY CATEGORY
              </button>

              <button
                type="button"
                className="category-modal__cancel"
                onClick={
                  handleCloseModal
                }
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PlayByCategory
