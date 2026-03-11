export function calculateSM2(
  quality: number,
  repetitions: number,
  previousInterval: number,
  previousEaseFactor: number,
  srsMultiplier: number = 1.2,
) {
  let interval: number
  let easeFactor = previousEaseFactor

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(previousInterval * easeFactor * srsMultiplier)
    }
    repetitions++
  } else {
    repetitions = 0
    interval = 1
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3

  return { interval, easeFactor, repetitions }
}

export function getNextReviewDate(intervalDays: number): number {
  const now = new Date()
  now.setDate(now.getDate() + intervalDays)
  return now.getTime()
}
