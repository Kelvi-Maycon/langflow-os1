// store/useCardStore.js — Flashcards + Sentences (M3 e M4)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uuid } from '../utils/shuffle.js';
import { calculateSRS, isDueToday, sortDueCards } from '../services/srs.js';
import { persistStorage } from '../utils/persistStorage.js';

const STORE_VERSION = 1;

export const useCardStore = create(
    persist(
        (set, get) => ({
            sentences: [],   // frases geradas no M3
            flashcards: [],  // cards para revisão M4

            // ── M3 Sentences ─────────────────────────────
            addSentences: (sentenceList) => {
                const existingKeys = new Set(
                    get().sentences.map(sentence => `${sentence.wordId}:${sentence.type}:${sentence.english}`)
                );
                const newSents = sentenceList
                    .filter(sentence => !existingKeys.has(`${sentence.wordId}:${sentence.type}:${sentence.english}`))
                    .map(s => ({
                    id: uuid(),
                    wordId: s.wordId,
                    wordText: s.wordText,
                    english: s.english,
                    portuguese: s.portuguese,
                    type: s.type, // positive | negative | past | future
                    words: s.english.split(' '),
                    attempts: 0,
                    maxAttempts: 3,
                    savedToFlashcard: false,
                    userProduction: '',
                    generatedAt: Date.now(),
                    }));
                set(state => ({ sentences: [...state.sentences, ...newSents] }));
                return newSents;
            },

            updateSentence: (id, updates) =>
                set(state => ({
                    sentences: state.sentences.map(s => s.id === id ? { ...s, ...updates } : s)
                })),

            getSentencesByWord: (wordId) =>
                get().sentences.filter(s => s.wordId === wordId),

            getRecentSentencesByWord: (wordId, limit = 3) =>
                get().sentences
                    .filter(sentence => sentence.wordId === wordId)
                    .sort((a, b) => (b.generatedAt || 0) - (a.generatedAt || 0))
                    .slice(0, limit),

            sentenceExistsRecent: (wordId, days = 7) => {
                const cutoff = Date.now() - days * 86400000;
                return get().sentences.some(s => s.wordId === wordId && s.generatedAt > cutoff);
            },

            // ── M4 Flashcards ─────────────────────────────
            addFlashcard: (sentenceId, wordId, front, back) => {
                const { flashcards } = get();
                if (flashcards.some(f => f.sentenceId === sentenceId)) return; // already saved

                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);

                const card = {
                    id: uuid(),
                    sentenceId,
                    wordId,
                    front, // portuguese
                    back,  // english
                    easeFactor: 2.5,
                    interval: 1,
                    nextReview: tomorrow.getTime(),
                    reviewCount: 0,
                    lapseCount: 0,
                    lastReviewResult: null,
                    createdAt: Date.now(),
                };
                set(state => ({ flashcards: [...state.flashcards, card] }));
                return card;
            },

            reviewCard: (id, rating) => {
                const { flashcards } = get();
                const card = flashcards.find(f => f.id === id);
                if (!card) return;

                const srsResult = calculateSRS(card, rating);
                set(state => ({
                    flashcards: state.flashcards.map(f =>
                        f.id === id
                            ? { ...f, ...srsResult, reviewCount: (f.reviewCount || 0) + 1 }
                            : f
                    )
                }));
                return srsResult;
            },

            getDueCards: () => get().flashcards.filter(isDueToday),

            getDueCardsSorted: (limit = Infinity) => sortDueCards(get().flashcards.filter(isDueToday)).slice(0, limit),

            clearAll: () => set({ sentences: [], flashcards: [] }),
        }),
        { name: 'langflow_cards', storage: persistStorage, version: STORE_VERSION }
    )
);
