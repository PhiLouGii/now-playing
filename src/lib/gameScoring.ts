export function calculatePoints(timeRemaining: number) {
  if (timeRemaining >= 8) {
    return 1000
  }

  if (timeRemaining >= 6) {
    return 800
  }

  if (timeRemaining >= 4) {
    return 600
  }

  if (timeRemaining >= 2) {
    return 400
  }

  if (timeRemaining >= 1) {
    return 200
  }

  return 0
}