import {
  Disc3,
  CassetteTape,
  Headphones,
  Music2,
  Radio,
  ArrowUpRight,
} from 'lucide-react'

import './PlayByCategory.css'

const categories = [
  {
    name: 'Pop',
    count: '01',
    icon: Disc3,
    type: 'genre',
  },
  {
    name: 'Hip-Hop',
    count: '02',
    icon: Headphones,
    type: 'genre',
  },
  {
    name: 'R&B',
    count: '03',
    icon: CassetteTape,
    type: 'genre',
  },
  {
    name: 'Afrobeats',
    count: '04',
    icon: Radio,
    type: 'genre',
  },
  {
    name: 'Amapiano',
    count: '05',
    icon: Disc3,
    type: 'genre',
  },
  {
    name: 'Indie',
    count: '06',
    icon: CassetteTape,
    type: 'genre',
  },
  {
    name: 'Rock',
    count: '07',
    icon: Headphones,
    type: 'genre',
  },
  {
    name: 'Dancehall',
    count: '08',
    icon: Radio,
    type: 'genre',
  },
  {
    name: 'K-Pop',
    count: '09',
    icon: Music2,
    type: 'genre',
  },
  {
    name: 'House',
    count: '10',
    icon: Disc3,
    type: 'genre',
  },
]

function PlayByCategory() {
  function handleCategoryClick(category: string) {
    console.log(`Play category: ${category}`)

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
            From pop hits to late-night house,
            pick a sound and start guessing.
          </p>
        </div>

        <div className="categories__collection">
          <div className="categories__collection-label">
            <span>MUSIC COLLECTION</span>
            <span>10 CATEGORIES</span>
          </div>

          <div className="categories__list">
            {categories.map((category) => {
              const Icon = category.icon

              return (
                <button
                  key={category.name}
                  type="button"
                  className="category-item"
                  onClick={() =>
                    handleCategoryClick(category.name)
                  }
                >
                  <span className="category-item__number">
                    {category.count}
                  </span>

                  <span className="category-item__record">
                    <Icon
                      size={22}
                      strokeWidth={1.5}
                    />
                  </span>

                  <span className="category-item__name">
                    {category.name}
                  </span>

                  <ArrowUpRight
                    className="category-item__arrow"
                    size={17}
                  />
                </button>
              )
            })}
          </div>
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