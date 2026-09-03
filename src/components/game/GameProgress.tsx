type GameProgressProps = {
  current: number
  total: number
}

import './GameProgress.css'

function GameProgress({
  current,
  total,
}: GameProgressProps) {
  const percentage = (current / total) * 100

  return (
    <div className="game-progress">
      <div className="game-progress__top">
        <span>
          QUESTION {String(current).padStart(2, '0')}
        </span>

        <span>
          {String(total).padStart(2, '0')}
        </span>
      </div>

      <div className="game-progress__track">
        <div
          className="game-progress__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default GameProgress