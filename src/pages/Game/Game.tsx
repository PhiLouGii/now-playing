import { mockQuestions } from '../../data/mockSongs'
import './Game.css'

function Game() {
  const question = mockQuestions[0]

  return (
    <div className="game-page">
      <div className="game-page__container">

        <header className="game-header">
          <div>
            <span className="game-header__label">
              ROUND
            </span>

            <strong>
              01 / 10
            </strong>
          </div>

          <div>
            <span className="game-header__label">
              SCORE
            </span>

            <strong>
              0
            </strong>
          </div>
        </header>

        <main className="game-content">

          <p className="game-content__category">
            NAME THAT SONG
          </p>

          <h1>
            What song is this?
          </h1>

          <div className="game-question">
            <div className="game-question__art">
              <span>
                ?
              </span>
            </div>

            <div className="game-question__waveform">
              AUDIO WAVEFORM
            </div>
          </div>

          <div className="game-answers">
            {question.answers.map((answer, index) => (
              <button
                key={answer}
                type="button"
                className="game-answer"
              >
                <span>
                  {String.fromCharCode(65 + index)}
                </span>

                {answer}
              </button>
            ))}
          </div>

        </main>

      </div>
    </div>
  )
}

export default Game