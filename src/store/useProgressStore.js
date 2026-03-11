import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { XP_PER_LEVEL } from '../constants/learning.js'
import { persistStorage } from '../utils/persistStorage.js'

const STORE_VERSION = 4
const DEFAULT_MIN_SESSION_MINUTES = 5
const AUTO_ADJUST_WINDOW = 20
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1']

function getDayKey(date = new Date()) {
  return date.toLocaleDateString('en-CA')
}

function legacyActionCount(day = {}) {
  return (
    (day.readerWords || 0) +
    (day.builderExercises || 0) +
    (day.flashcardReviews || 0) +
    (day.productionWrites || 0)
  )
}

function getStudySecondsForDay(day = {}) {
  if (typeof day.studySeconds === 'number') {
    return day.studySeconds
  }

  return legacyActionCount(day) * 60
}

function emptyDailyStats() {
  return {
    readerWords: 0,
    builderExercises: 0,
    transformExercises: 0,
    clozeExercises: 0,
    flashcardReviews: 0,
    productionWrites: 0,
    dailyPrompts: 0,
    recycledWords: 0,
    savedCards: 0,
    perfectBuilds: 0,
    xp: 0,
    studySeconds: 0,
    firstActionAt: null,
    lastActionAt: null,
    retentionHits: 0,
    retentionTotal: 0,
    activeWordsSnapshot: 0,
    masteredWordsSnapshot: 0,
  }
}

function createInitialState() {
  return {
    xp: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDay: null,
    dailyStats: {},
    totals: {
      readerWords: 0,
      builderExercises: 0,
      transformExercises: 0,
      clozeExercises: 0,
      flashcardReviews: 0,
      productionWrites: 0,
      dailyPrompts: 0,
      recycledWords: 0,
      savedCards: 0,
      perfectBuilds: 0,
      activeWords: 0,
      masteredWords: 0,
    },
    wordJourney: {},
    achievements: [],
    dailyPromptHistory: {},
    builderRecentResults: [],
    autoAdjustMeta: {
      lastAdjustedAt: null,
      lastAdjustedOnExerciseCount: 0,
      lastDirection: null,
      fromLevel: null,
      toLevel: null,
      accuracy: null,
      windowSize: 0,
    },
    lastXpGain: null,
  }
}

function withDayRecord(state, dayKey) {
  return {
    ...state,
    dailyStats: {
      ...state.dailyStats,
      [dayKey]: {
        ...emptyDailyStats(),
        ...(state.dailyStats[dayKey] || {}),
      },
    },
  }
}

function computeLevel(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

function isStudyDayQualified(day, minSessionMinutes = DEFAULT_MIN_SESSION_MINUTES) {
  return getStudySecondsForDay(day) >= minSessionMinutes * 60
}

function calculateStreakStats(dailyStats, minSessionMinutes = DEFAULT_MIN_SESSION_MINUTES) {
  const qualifiedDays = Object.keys(dailyStats || {})
    .filter((dayKey) => isStudyDayQualified(dailyStats[dayKey], minSessionMinutes))
    .sort()

  if (qualifiedDays.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDay: null,
      weeklyActive: 0,
    }
  }

  let longestStreak = 0
  let runningStreak = 0
  let previousDay = null

  qualifiedDays.forEach((dayKey) => {
    if (!previousDay) {
      runningStreak = 1
    } else {
      const previous = new Date(`${previousDay}T00:00:00`)
      const current = new Date(`${dayKey}T00:00:00`)
      const diff = Math.round((current.getTime() - previous.getTime()) / 86400000)
      runningStreak = diff === 1 ? runningStreak + 1 : 1
    }

    longestStreak = Math.max(longestStreak, runningStreak)
    previousDay = dayKey
  })

  const lastActiveDay = qualifiedDays.at(-1)
  let currentStreak = 0

  if (lastActiveDay) {
    const todayKey = getDayKey()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = getDayKey(yesterday)

    if (lastActiveDay === todayKey || lastActiveDay === yesterdayKey) {
      currentStreak = runningStreak
    }
  }

  const weeklyActive = getStudyDaysInLast(7, dailyStats, minSessionMinutes)

  return {
    currentStreak,
    longestStreak,
    lastActiveDay,
    weeklyActive,
  }
}

function getStudyDaysInLast(days, dailyStats, minSessionMinutes = DEFAULT_MIN_SESSION_MINUTES) {
  const today = new Date()
  let count = 0

  for (let i = 0; i < days; i += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const day = dailyStats[getDayKey(date)]
    if (day && isStudyDayQualified(day, minSessionMinutes)) {
      count += 1
    }
  }

  return count
}

function calculateRetentionRate(dailyStats, days = 7) {
  const today = new Date()
  let hits = 0
  let total = 0

  for (let i = 0; i < days; i += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const day = dailyStats[getDayKey(date)]
    if (!day) continue
    hits += day.retentionHits || 0
    total += day.retentionTotal || 0
  }

  return {
    hits,
    total,
    rate: total > 0 ? Math.round((hits / total) * 100) : 0,
  }
}

function getLatestActiveDay(dailyStats = {}) {
  return (
    Object.keys(dailyStats)
      .filter(
        (dayKey) =>
          legacyActionCount(dailyStats[dayKey]) > 0 ||
          getStudySecondsForDay(dailyStats[dayKey]) > 0,
      )
      .sort()
      .at(-1) ?? null
  )
}

function syncStoredStreakMetrics(state) {
  const stats = calculateStreakStats(state.dailyStats, DEFAULT_MIN_SESSION_MINUTES)
  return {
    ...state,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    lastActiveDay: stats.lastActiveDay ?? getLatestActiveDay(state.dailyStats),
  }
}

function buildAchievements(state) {
  const achievements = []
  if (state.totals.readerWords >= 1) achievements.push('first_discovery')
  if (state.totals.builderExercises >= 25) achievements.push('builder_apprentice')
  if (state.totals.savedCards >= 20) achievements.push('memory_keeper')
  if (state.totals.recycledWords >= 15) achievements.push('recycler')
  if (state.totals.perfectBuilds >= 10) achievements.push('perfect_flow')
  if (getStudyDaysInLast(7, state.dailyStats, DEFAULT_MIN_SESSION_MINUTES) >= 4)
    achievements.push('weekly_rhythm')
  if (state.totals.activeWords >= 10) achievements.push('active_lexicon')
  if (state.totals.dailyPrompts >= 1) achievements.push('prompt_starter')
  return achievements
}

function addStudyTime(day, timestamp = Date.now()) {
  const next = {
    ...emptyDailyStats(),
    ...day,
  }

  if (!next.firstActionAt) {
    next.firstActionAt = timestamp
    next.lastActionAt = timestamp
    next.studySeconds = Math.max(next.studySeconds || 0, 60)
    return next
  }

  const diffSeconds = Math.round((timestamp - next.lastActionAt) / 1000)
  const boundedSeconds = Math.min(
    180,
    Math.max(30, Number.isFinite(diffSeconds) ? diffSeconds : 60),
  )

  next.studySeconds = (next.studySeconds || 0) + boundedSeconds
  next.lastActionAt = timestamp
  return next
}

function addXpToState(state, amount, dayKey, source) {
  const timestamp = Date.now()
  let next = withDayRecord(state, dayKey)

  next = {
    ...next,
    dailyStats: {
      ...next.dailyStats,
      [dayKey]: addStudyTime(next.dailyStats[dayKey], timestamp),
    },
  }

  const xp = next.xp + amount
  next = {
    ...next,
    xp,
    level: computeLevel(xp),
    lastXpGain: { amount, source, at: timestamp },
    dailyStats: {
      ...next.dailyStats,
      [dayKey]: {
        ...next.dailyStats[dayKey],
        xp: next.dailyStats[dayKey].xp + amount,
      },
    },
  }

  return syncStoredStreakMetrics(next)
}

function normalizeDailyStats(dailyStats = {}) {
  return Object.fromEntries(
    Object.entries(dailyStats).map(([dayKey, value]) => [
      dayKey,
      {
        ...emptyDailyStats(),
        ...value,
        studySeconds: value.studySeconds ?? legacyActionCount(value) * 60,
      },
    ]),
  )
}

function moveLevel(currentLevel, direction) {
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel)
  if (currentIndex === -1) return null

  if (direction === 'up' && currentIndex < LEVEL_ORDER.length - 1) {
    return LEVEL_ORDER[currentIndex + 1]
  }

  if (direction === 'down' && currentIndex > 0) {
    return LEVEL_ORDER[currentIndex - 1]
  }

  return null
}

function maybeResolveAutoAdjust(state, { currentLevel, autoAdjustEnabled }) {
  const recentResults = state.builderRecentResults || []
  const exerciseCount = state.totals.builderExercises || 0
  const windowSize = recentResults.length
  const accuracy = windowSize > 0 ? recentResults.filter(Boolean).length / windowSize : 0

  const baseMeta = {
    ...state.autoAdjustMeta,
    accuracy: windowSize > 0 ? Math.round(accuracy * 100) : null,
    windowSize,
  }

  if (!autoAdjustEnabled || !currentLevel || windowSize < AUTO_ADJUST_WINDOW) {
    return {
      state: {
        ...state,
        autoAdjustMeta: baseMeta,
      },
      adjustment: null,
    }
  }

  if (
    exerciseCount - (state.autoAdjustMeta?.lastAdjustedOnExerciseCount || 0) <
    AUTO_ADJUST_WINDOW
  ) {
    return {
      state: {
        ...state,
        autoAdjustMeta: baseMeta,
      },
      adjustment: null,
    }
  }

  let direction = null
  if (accuracy >= 0.9) direction = 'up'
  if (accuracy <= 0.4) direction = 'down'

  if (!direction) {
    return {
      state: {
        ...state,
        autoAdjustMeta: baseMeta,
      },
      adjustment: null,
    }
  }

  const nextLevel = moveLevel(currentLevel, direction)
  if (!nextLevel || nextLevel === currentLevel) {
    return {
      state: {
        ...state,
        autoAdjustMeta: baseMeta,
      },
      adjustment: null,
    }
  }

  const adjustment = {
    from: currentLevel,
    to: nextLevel,
    direction,
    accuracy: Math.round(accuracy * 100),
  }

  return {
    state: {
      ...state,
      autoAdjustMeta: {
        ...baseMeta,
        lastAdjustedAt: Date.now(),
        lastAdjustedOnExerciseCount: exerciseCount,
        lastDirection: direction,
        fromLevel: currentLevel,
        toLevel: nextLevel,
      },
    },
    adjustment,
  }
}

function migrateProgress(persistedState) {
  const base = createInitialState()
  const next = {
    ...base,
    ...(persistedState || {}),
  }

  next.dailyStats = normalizeDailyStats(persistedState?.dailyStats || {})
  next.totals = {
    ...base.totals,
    ...(persistedState?.totals || {}),
    transformExercises: persistedState?.totals?.transformExercises ?? 0,
    clozeExercises: persistedState?.totals?.clozeExercises ?? 0,
    dailyPrompts: persistedState?.totals?.dailyPrompts ?? 0,
    masteredWords: persistedState?.totals?.masteredWords ?? 0,
  }
  next.wordJourney = persistedState?.wordJourney || {}
  next.achievements = persistedState?.achievements || []
  next.dailyPromptHistory = persistedState?.dailyPromptHistory || {}
  next.builderRecentResults = Array.isArray(persistedState?.builderRecentResults)
    ? persistedState.builderRecentResults.slice(-AUTO_ADJUST_WINDOW)
    : []
  next.autoAdjustMeta = {
    ...base.autoAdjustMeta,
    ...(persistedState?.autoAdjustMeta || {}),
  }

  return syncStoredStreakMetrics(next)
}

export const useProgressStore = create(
  persist(
    (set) => ({
      ...createInitialState(),

      awardXp: (amount, source = 'study') => {
        const dayKey = getDayKey()
        set((state) => {
          const next = addXpToState(state, amount, dayKey, source)
          return { ...next, achievements: buildAchievements(next) }
        })
      },

      recordReaderWord: ({ wordId, isNewWord, isRecycled }) => {
        const dayKey = getDayKey()
        set((state) => {
          let next = withDayRecord(state, dayKey)
          const journey = next.wordJourney[wordId] || {}
          const alreadyTracked = journey.lastReaderDay === dayKey
          if (alreadyTracked) return next

          next = {
            ...next,
            wordJourney: {
              ...next.wordJourney,
              [wordId]: {
                ...journey,
                discovered: true,
                readerSeenCount: (journey.readerSeenCount || 0) + 1,
                recycledCount: (journey.recycledCount || 0) + (isRecycled ? 1 : 0),
                lastReaderDay: dayKey,
              },
            },
            totals: {
              ...next.totals,
              readerWords: next.totals.readerWords + 1,
              recycledWords: next.totals.recycledWords + (isRecycled ? 1 : 0),
            },
            dailyStats: {
              ...next.dailyStats,
              [dayKey]: {
                ...next.dailyStats[dayKey],
                readerWords: next.dailyStats[dayKey].readerWords + 1,
                recycledWords: next.dailyStats[dayKey].recycledWords + (isRecycled ? 1 : 0),
              },
            },
          }

          next = addXpToState(
            next,
            isNewWord ? 5 : 3,
            dayKey,
            isNewWord ? 'reader:new-word' : 'reader:revisit',
          )
          return { ...next, achievements: buildAchievements(next) }
        })
      },

      recordBuilderExercise: ({
        wordId,
        firstTry,
        recycled,
        success = true,
        currentLevel,
        autoAdjustEnabled = false,
        mode = 'assembly',
      }) => {
        const dayKey = getDayKey()
        let adjustment = null

        set((state) => {
          let next = withDayRecord(state, dayKey)
          const journey = next.wordJourney[wordId] || {}
          const nextRecentResults = [...(next.builderRecentResults || []), success].slice(
            -AUTO_ADJUST_WINDOW,
          )

          next = {
            ...next,
            builderRecentResults: nextRecentResults,
            wordJourney: {
              ...next.wordJourney,
              [wordId]: {
                ...journey,
                practiced: true,
                practicedCount: (journey.practicedCount || 0) + 1,
                recycledCount: (journey.recycledCount || 0) + (recycled ? 1 : 0),
                lastBuilderSuccess: success,
              },
            },
            totals: {
              ...next.totals,
              builderExercises: next.totals.builderExercises + 1,
              transformExercises: next.totals.transformExercises + (mode === 'transform' ? 1 : 0),
              clozeExercises: next.totals.clozeExercises + (mode === 'cloze' ? 1 : 0),
              perfectBuilds: next.totals.perfectBuilds + (firstTry ? 1 : 0),
              recycledWords: next.totals.recycledWords + (recycled ? 1 : 0),
            },
            dailyStats: {
              ...next.dailyStats,
              [dayKey]: {
                ...next.dailyStats[dayKey],
                builderExercises: next.dailyStats[dayKey].builderExercises + 1,
                transformExercises:
                  next.dailyStats[dayKey].transformExercises + (mode === 'transform' ? 1 : 0),
                clozeExercises: next.dailyStats[dayKey].clozeExercises + (mode === 'cloze' ? 1 : 0),
                perfectBuilds: next.dailyStats[dayKey].perfectBuilds + (firstTry ? 1 : 0),
                recycledWords: next.dailyStats[dayKey].recycledWords + (recycled ? 1 : 0),
              },
            },
          }

          next = addXpToState(
            next,
            firstTry ? 20 : 10,
            dayKey,
            firstTry ? 'builder:first-try' : 'builder:complete',
          )
          const resolved = maybeResolveAutoAdjust(next, { currentLevel, autoAdjustEnabled })
          adjustment = resolved.adjustment
          next = resolved.state
          return { ...next, achievements: buildAchievements(next) }
        })

        return adjustment
      },

      recordProductionWrite: ({ wordId }) => {
        const dayKey = getDayKey()
        set((state) => {
          let next = withDayRecord(state, dayKey)
          const journey = next.wordJourney[wordId] || {}

          next = {
            ...next,
            wordJourney: {
              ...next.wordJourney,
              [wordId]: {
                ...journey,
                produced: true,
                producedCount: (journey.producedCount || 0) + 1,
              },
            },
            totals: {
              ...next.totals,
              productionWrites: next.totals.productionWrites + 1,
            },
            dailyStats: {
              ...next.dailyStats,
              [dayKey]: {
                ...next.dailyStats[dayKey],
                productionWrites: next.dailyStats[dayKey].productionWrites + 1,
              },
            },
          }

          next = addXpToState(next, 12, dayKey, 'builder:production')
          return { ...next, achievements: buildAchievements(next) }
        })
      },

      recordDailyPromptCompletion: ({ wordIds = [], answers = [], targets = [] }) => {
        const dayKey = getDayKey()
        let result = { alreadyCompleted: false }

        set((state) => {
          if (state.dailyPromptHistory?.[dayKey]) {
            result = { alreadyCompleted: true }
            return state
          }

          let next = withDayRecord(state, dayKey)
          const uniqueWordIds = [...new Set(wordIds.filter(Boolean))]
          const journeyUpdates = { ...next.wordJourney }

          uniqueWordIds.forEach((wordId) => {
            const journey = journeyUpdates[wordId] || {}
            journeyUpdates[wordId] = {
              ...journey,
              produced: true,
              producedCount: (journey.producedCount || 0) + 1,
              lastPromptDay: dayKey,
            }
          })

          next = {
            ...next,
            wordJourney: journeyUpdates,
            dailyPromptHistory: {
              ...next.dailyPromptHistory,
              [dayKey]: {
                completedAt: Date.now(),
                wordIds: uniqueWordIds,
                answers,
                targets,
              },
            },
            totals: {
              ...next.totals,
              dailyPrompts: next.totals.dailyPrompts + 1,
              productionWrites: next.totals.productionWrites + answers.length,
            },
            dailyStats: {
              ...next.dailyStats,
              [dayKey]: {
                ...next.dailyStats[dayKey],
                dailyPrompts: next.dailyStats[dayKey].dailyPrompts + 1,
                productionWrites: next.dailyStats[dayKey].productionWrites + answers.length,
              },
            },
          }

          next = addXpToState(next, 45, dayKey, 'prompt:daily-complete')
          result = { alreadyCompleted: false, awarded: true }
          return { ...next, achievements: buildAchievements(next) }
        })

        return result
      },

      recordCardSaved: ({ wordId }) => {
        const dayKey = getDayKey()
        set((state) => {
          let next = withDayRecord(state, dayKey)
          const journey = next.wordJourney[wordId] || {}

          next = {
            ...next,
            wordJourney: {
              ...next.wordJourney,
              [wordId]: {
                ...journey,
                saved: true,
                savedCount: (journey.savedCount || 0) + 1,
              },
            },
            totals: {
              ...next.totals,
              savedCards: next.totals.savedCards + 1,
            },
            dailyStats: {
              ...next.dailyStats,
              [dayKey]: {
                ...next.dailyStats[dayKey],
                savedCards: next.dailyStats[dayKey].savedCards + 1,
              },
            },
          }

          next = addXpToState(next, 5, dayKey, 'builder:save-card')
          return { ...next, achievements: buildAchievements(next) }
        })
      },

      recordFlashcardReview: ({ wordId, rating }) => {
        const dayKey = getDayKey()
        const xpByRating = {
          nao_lembro: 8,
          dificil: 9,
          bom: 10,
          facil: 12,
        }

        set((state) => {
          let next = withDayRecord(state, dayKey)
          const journey = next.wordJourney[wordId] || {}
          const retained = rating !== 'nao_lembro'

          next = {
            ...next,
            wordJourney: {
              ...next.wordJourney,
              [wordId]: {
                ...journey,
                reviewed: true,
                reviewCount: (journey.reviewCount || 0) + 1,
                lastReviewRating: rating,
              },
            },
            totals: {
              ...next.totals,
              flashcardReviews: next.totals.flashcardReviews + 1,
            },
            dailyStats: {
              ...next.dailyStats,
              [dayKey]: {
                ...next.dailyStats[dayKey],
                flashcardReviews: next.dailyStats[dayKey].flashcardReviews + 1,
                retentionHits: next.dailyStats[dayKey].retentionHits + (retained ? 1 : 0),
                retentionTotal: next.dailyStats[dayKey].retentionTotal + 1,
              },
            },
          }

          next = addXpToState(next, xpByRating[rating] || 10, dayKey, `flashcard:${rating}`)
          return { ...next, achievements: buildAchievements(next) }
        })
      },

      syncWordStatusTotals: ({ activeWords, masteredWords }) => {
        const dayKey = getDayKey()
        set((state) => {
          const next = withDayRecord(state, dayKey)
          const updated = {
            ...next,
            totals: {
              ...next.totals,
              activeWords,
              masteredWords,
            },
            dailyStats: {
              ...next.dailyStats,
              [dayKey]: {
                ...next.dailyStats[dayKey],
                activeWordsSnapshot: activeWords,
                masteredWordsSnapshot: masteredWords,
              },
            },
          }
          return { ...updated, achievements: buildAchievements(updated) }
        })
      },

      resetProgress: () => set(createInitialState()),
    }),
    {
      name: 'langflow_progress',
      storage: persistStorage,
      version: STORE_VERSION,
      migrate: (persistedState) => migrateProgress(persistedState),
    },
  ),
)

export {
  calculateRetentionRate,
  calculateStreakStats,
  getDayKey,
  getStudySecondsForDay,
  LEVEL_ORDER,
}
