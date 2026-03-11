import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { uuid } from '../utils/shuffle.js'
import {
  getStatusAfterBuilder,
  getStatusAfterReader,
  getStatusAfterReview,
} from '../services/srs.js'
import { persistStorage } from '../utils/persistStorage.js'
import { inferEntryType, normalizeLexiconText } from '../utils/lexicon.js'

const STORE_VERSION = 3

function createWord(
  wordStr,
  {
    originalSentence = '',
    tag = 'manual',
    tooltipExplanation = '',
    initialStatus = 'desconhecida',
    entryType = 'word',
    cefrLevel = null,
    source = 'manual',
    isSeeded = false,
  } = {},
) {
  const normalizedWord = normalizeLexiconText(wordStr)

  return {
    id: uuid(),
    word: normalizedWord,
    status: initialStatus,
    tag,
    originalSentence,
    tooltipExplanation,
    entryType: entryType || inferEntryType(normalizedWord, 'word'),
    cefrLevel,
    source,
    isSeeded,
    addedAt: Date.now(),
    lastSeenAt: Date.now(),
    correctCount: 0,
    errorCount: 0,
    dragCorrectCount: 0,
    dragWrongCount: 0,
    builderErrorStreak: 0,
    easeFactor: 2.5,
    reviewCount: 0,
    recentLapses: 0,
  }
}

function hasMeaningfulProgress(word = {}) {
  return (
    (word.correctCount ?? word.dragCorrectCount ?? 0) > 0 ||
    (word.errorCount ?? word.dragWrongCount ?? 0) > 0 ||
    (word.reviewCount ?? 0) > 0 ||
    Boolean(word.tooltipExplanation) ||
    Boolean(word.originalSentence) ||
    word.status !== 'desconhecida'
  )
}

function normalizeWordRecord(word) {
  const normalizedWord = normalizeLexiconText(word.word || '')
  const entryType = word.entryType || inferEntryType(normalizedWord, word.entryType || 'word')

  return {
    ...createWord(normalizedWord, {
      originalSentence: word.originalSentence || '',
      tag: word.tag || 'manual',
      tooltipExplanation: word.tooltipExplanation || '',
      initialStatus: word.status || 'desconhecida',
      entryType,
      cefrLevel: word.cefrLevel ?? null,
      source: word.source || (word.isSeeded ? 'ngsl' : 'manual'),
      isSeeded: word.isSeeded ?? false,
    }),
    ...word,
    word: normalizedWord,
    entryType,
    cefrLevel: word.cefrLevel ?? null,
    source: word.source || (word.isSeeded ? 'ngsl' : 'manual'),
    isSeeded: word.isSeeded ?? false,
    correctCount: word.correctCount ?? word.dragCorrectCount ?? 0,
    errorCount: word.errorCount ?? word.dragWrongCount ?? 0,
    dragCorrectCount: word.dragCorrectCount ?? word.correctCount ?? 0,
    dragWrongCount: word.dragWrongCount ?? word.errorCount ?? 0,
    builderErrorStreak: word.builderErrorStreak ?? 0,
    easeFactor: word.easeFactor ?? 2.5,
    reviewCount: word.reviewCount ?? 0,
    recentLapses: word.recentLapses ?? 0,
  }
}

function buildExistingIndex(words) {
  return new Map(words.map((word) => [word.word, word]))
}

export const useWordStore = create(
  persist(
    (set, get) => ({
      words: [],

      addWord: (wordStr, options = {}) => {
        const { words } = get()
        const clean = normalizeLexiconText(wordStr)
        if (!clean) return null

        const existing = words.find((word) => word.word === clean)
        if (existing) {
          if (options && Object.keys(options).length > 0) {
            get().updateWord(existing.id, {
              entryType: existing.entryType || inferEntryType(clean, options.entryType || 'word'),
              cefrLevel: existing.cefrLevel ?? options.cefrLevel ?? null,
              source: existing.source || options.source || 'manual',
              isSeeded: existing.isSeeded || Boolean(options.isSeeded),
            })
          }
          return existing
        }

        const word = createWord(clean, options)
        set((state) => ({ words: [word, ...state.words] }))
        return word
      },

      addManyWords: (wordList, options = {}) => {
        const existingIndex = buildExistingIndex(get().words)
        const incomingWords = []
        const seen = new Set()
        let skipped = 0

        wordList.forEach((value) => {
          const clean = normalizeLexiconText(value)
          if (!clean || seen.has(clean) || existingIndex.has(clean)) {
            skipped += 1
            return
          }

          seen.add(clean)
          incomingWords.push(createWord(clean, options))
        })

        if (incomingWords.length > 0) {
          set((state) => ({ words: [...incomingWords, ...state.words] }))
        }

        return { added: incomingWords.length, skipped }
      },

      importSeedWords: (entries = []) => {
        const existingIndex = buildExistingIndex(get().words)
        const incomingWords = []
        const seen = new Set()
        let skipped = 0

        entries.forEach((entry) => {
          const clean = normalizeLexiconText(entry?.text)
          if (!clean || seen.has(clean) || existingIndex.has(clean)) {
            skipped += 1
            return
          }

          seen.add(clean)
          incomingWords.push(
            createWord(clean, {
              tag: 'seed',
              entryType: entry.entryType || inferEntryType(clean, 'word'),
              cefrLevel: entry.cefrLevel ?? null,
              source: entry.source || 'ngsl',
              isSeeded: true,
            }),
          )
        })

        if (incomingWords.length > 0) {
          set((state) => ({ words: [...incomingWords, ...state.words] }))
        }

        return { added: incomingWords.length, skipped }
      },

      removeUnstudiedSeedWords: () => {
        const removableIds = new Set(
          get()
            .words.filter((word) => word.isSeeded && !hasMeaningfulProgress(word))
            .map((word) => word.id),
        )

        if (removableIds.size === 0) {
          return 0
        }

        set((state) => ({
          words: state.words.filter((word) => !removableIds.has(word.id)),
        }))

        return removableIds.size
      },

      updateWord: (id, updates) =>
        set((state) => ({
          words: state.words.map((word) => (word.id === id ? { ...word, ...updates } : word)),
        })),

      removeWord: (id) => set((state) => ({ words: state.words.filter((word) => word.id !== id) })),

      markSeenInReader: (wordId) => {
        const { words, updateWord } = get()
        const word = words.find((item) => item.id === wordId)
        if (!word) return

        updateWord(wordId, {
          status: getStatusAfterReader(word),
          lastSeenAt: Date.now(),
        })
      },

      markBuilderResult: (wordId, { correct }) => {
        const { words, updateWord } = get()
        const word = words.find((item) => item.id === wordId)
        if (!word) return

        const updates = correct
          ? {
              correctCount: (word.correctCount ?? word.dragCorrectCount ?? 0) + 1,
              dragCorrectCount: (word.dragCorrectCount ?? word.correctCount ?? 0) + 1,
              builderErrorStreak: 0,
              lastPracticedAt: Date.now(),
            }
          : {
              errorCount: (word.errorCount ?? word.dragWrongCount ?? 0) + 1,
              dragWrongCount: (word.dragWrongCount ?? word.errorCount ?? 0) + 1,
              builderErrorStreak: (word.builderErrorStreak ?? 0) + 1,
              lastPracticedAt: Date.now(),
            }

        if (correct) {
          updates.errorCount = word.errorCount ?? word.dragWrongCount ?? 0
          updates.dragWrongCount = word.dragWrongCount ?? word.errorCount ?? 0
        } else {
          updates.correctCount = word.correctCount ?? word.dragCorrectCount ?? 0
          updates.dragCorrectCount = word.dragCorrectCount ?? word.correctCount ?? 0
        }

        const merged = { ...word, ...updates }
        updates.status = getStatusAfterBuilder(merged, { correct })
        updateWord(wordId, updates)
      },

      promoteFromSRS: (wordId, srsResult) => {
        const { words, updateWord } = get()
        const word = words.find((item) => item.id === wordId)
        if (!word) return

        const recentLapses =
          srsResult?.lastReviewResult === 'nao_lembro' ? (word.recentLapses ?? 0) + 1 : 0
        const reviewCount = (word.reviewCount ?? 0) + 1
        const easeFactor = srsResult?.easeFactor ?? word.easeFactor
        const newStatus = getStatusAfterReview(
          { ...word, reviewCount, easeFactor, recentLapses },
          srsResult?.lastReviewResult,
        )

        updateWord(wordId, {
          status: newStatus,
          reviewCount,
          recentLapses,
          easeFactor,
          lastReviewedAt: Date.now(),
        })
      },

      getWordByText: (text) => {
        const clean = normalizeLexiconText(text)
        return get().words.find((word) => word.word === clean)
      },

      getWordsByStatus: (status) => get().words.filter((word) => word.status === status),

      clearAll: () => set({ words: [] }),
    }),
    {
      name: 'langflow_words',
      storage: persistStorage,
      version: STORE_VERSION,
      migrate: (persistedState) => ({
        words: Array.isArray(persistedState?.words)
          ? persistedState.words.map(normalizeWordRecord)
          : [],
      }),
    },
  ),
)
