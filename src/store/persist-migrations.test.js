import { describe, expect, it } from 'vitest'
import { useConfig } from './useConfig.js'
import { useProgressStore } from './useProgressStore.js'
import { useWordStore } from './useWordStore.js'

describe('persist migrations', () => {
  it('moves legacy builder weight into config.builder', () => {
    const migrate = useConfig.persist.getOptions().migrate
    const migrated = migrate({
      config: {
        userLevel: 'B2',
        wordBankWeight: 45,
      },
    })

    expect(migrated.config.userLevel).toBe('B2')
    expect(migrated.config.builder.difficultWordsWeight).toBe(45)
    expect(migrated.config.builder.phrasesPerWord).toBe(3)
  })

  it('adds streak metadata to legacy progress payloads', () => {
    const migrate = useProgressStore.persist.getOptions().migrate
    const migrated = migrate({
      xp: 120,
      level: 2,
      dailyStats: {
        '2026-03-08': {
          readerWords: 1,
          builderExercises: 0,
          flashcardReviews: 0,
          productionWrites: 0,
          recycledWords: 0,
          savedCards: 0,
          perfectBuilds: 0,
          xp: 5,
        },
      },
    })

    expect(migrated.currentStreak).toBe(0)
    expect(migrated.longestStreak).toBe(0)
    expect(migrated.lastActiveDay).toBe('2026-03-08')
  })

  it('normalizes old word counters into the new shape', () => {
    const migrate = useWordStore.persist.getOptions().migrate
    const migrated = migrate({
      words: [
        {
          id: 'word-1',
          word: 'relentless',
          status: 'em_treino',
          dragCorrectCount: 4,
          dragWrongCount: 2,
        },
      ],
    })

    expect(migrated.words[0].correctCount).toBe(4)
    expect(migrated.words[0].errorCount).toBe(2)
    expect(migrated.words[0].dragCorrectCount).toBe(4)
    expect(migrated.words[0].dragWrongCount).toBe(2)
    expect(migrated.words[0].entryType).toBe('word')
    expect(migrated.words[0].cefrLevel).toBeNull()
    expect(migrated.words[0].source).toBe('manual')
    expect(migrated.words[0].isSeeded).toBe(false)
  })
})
