import { ArrowUpRight } from 'lucide-react'
import './PlayByCategory.css'

const categories = [
  {
    name: 'Pop',
    count: '01',
    type: 'genre',
  },
  {
    name: 'Hip-Hop',
    count: '02',
    type: 'genre',
  },
  {
    name: 'R&B',
    count: '03',
    type: 'genre',
  },
  {
    name: 'Afrobeats',
    count: '04',
    type: 'genre',
  },
  {
    name: 'Amapiano',
    count: '05',
    type: 'genre',
  },
  {
    name: 'Indie',
    count: '06',
    type: 'genre',
  },
  {
    name: 'Rock',
    count: '07',
    type: 'genre',
  },
  {
    name: 'Dancehall',
    count: '08',
    type: 'genre',
  },
  {
    name: 'K-Pop',
    count: '09',
    type: 'genre',
  },
  {
    name: 'House',
    count: '10',
    type: 'genre',
  },
]

function PlayByCategory() {
  function handleCategoryClick(
    category: string,
  ) {
    console.log(
      `Play category: ${category}`,
    )

    // Gameplay routing will be connected here.
  }

  return (
    <section className="categories">
      <div className="categories__container">

        <div className="categories__header">
          <div>
            <p className="label">
              PLAY BY CATEGORY
            </p>

            <h2 className="heading-lg">
              Pick your sound.
            </h2>
          </div>

          <p className="categories__intro">
            Choose a category and put your
            music knowledge to the test.
          </p>
        </div>

        <div className="categories__list">
          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              className="category-item"
              onClick={() =>
                handleCategoryClick(
                  category.name,
                )
              }
            >
              <span className="category-item__number">
                {category.count}
              </span>

              <span className="category-item__name">
                {category.name}
              </span>

              <ArrowUpRight
                className="category-item__arrow"
                size={17}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          className="categories__view-all"
        >
          <span>VIEW ALL CATEGORIES</span>
          <ArrowUpRight size={16} />
        </button>

      </div>
    </section>
  )
}

export default PlayByCategory