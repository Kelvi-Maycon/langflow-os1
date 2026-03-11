import { describe, expect, it } from 'vitest'
import {
  demoteWordStatus,
  getStatusAfterBuilder,
  getStatusAfterReader,
  getStatusAfterReview,
  sortDueCards,
} from './srs.js'

describe('srs helpers', () => {
  it('promotes unknown words to recognized when they are clicked in the reader', () => {
    expect(getStatusAfterReader({ status: 'desconhecida' })).toBe('reconhecida')
    expect(getStatusAfterReader({ status: 'em_treino' })).toBe('em_treino')
  })

  it('pushes builder words into training and later to active', () => {
    expect(
      getStatusAfterBuilder(
        { status: 'reconhecida', correctCount: 0, reviewCount: 0 },
        { correct: true },
      ),
    ).toBe('em_treino')

    expect(
      getStatusAfterBuilder(
        { status: 'em_treino', correctCount: 2, reviewCount: 2, recentLapses: 0, easeFactor: 2.2 },
        { correct: true },
      ),
    ).toBe('ativa')
  })

  it('demotes after a failed review and sorts due cards by delay then ease factor', () => {
    expect(demoteWordStatus('dominada')).toBe('ativa')
    expect(
      getStatusAfterReview(
        { status: 'ativa', correctCount: 4, reviewCount: 5, recentLapses: 0, easeFactor: 2.4 },
        'bom',
      ),
    ).toBe('dominada')
    expect(
      getStatusAfterReview(
        { status: 'ativa', correctCount: 4, reviewCount: 5, recentLapses: 1, easeFactor: 2.4 },
        'nao_lembro',
      ),
    ).toBe('em_treino')

    const now = Date.now()
    const sorted = sortDueCards([
      { id: 'easy-late', nextReview: now - 1000 * 60 * 60 * 6, easeFactor: 2.7, createdAt: 2 },
      { id: 'hard-late', nextReview: now - 1000 * 60 * 60 * 6, easeFactor: 1.9, createdAt: 1 },
      { id: 'older-delay', nextReview: now - 1000 * 60 * 60 * 24, easeFactor: 2.5, createdAt: 3 },
    ])

    expect(sorted.map((card) => card.id)).toEqual(['older-delay', 'hard-late', 'easy-late'])
  })
})
