import { describe, expect, it } from 'vitest';
import { buildBuilderExercises, buildSentenceVariants, selectBuilderWords } from './session.js';

describe('builder session helpers', () => {
  it('prioritizes reader words and limits extra bank words by the configured weight', () => {
    const selected = selectBuilderWords({
      initialWords: [
        { wordId: 'reader-1', wordText: 'relentless', originalSentence: 'A relentless effort.' },
        { wordId: 'reader-2', wordText: 'abundant', originalSentence: 'An abundant harvest.' },
      ],
      bankWords: [
        { id: 'bank-1', word: 'diligent', status: 'em_treino', addedAt: 1 },
        { id: 'bank-2', word: 'substantial', status: 'reconhecida', addedAt: 2 },
        { id: 'bank-3', word: 'volatile', status: 'desconhecida', addedAt: 3 },
      ],
      builderConfig: {
        sessionWordLimit: 5,
        difficultWordsWeight: 40,
      },
    });

    expect(selected.map(word => word.wordId)).toEqual(['reader-1', 'reader-2', 'bank-1', 'bank-2']);
    expect(selected[0].recycled).toBe(false);
    expect(selected.at(-1).recycled).toBe(true);
  });

  it('builds up to three sentence variants using cache first and local fallback as backup', () => {
    const variants = buildSentenceVariants({
      wordId: 'word-1',
      wordText: 'relentless',
      cachedSentences: [
        { id: 'cached-1', english: 'She is relentless at work.', portuguese: 'Ela e incansavel no trabalho.', type: 'positive' },
      ],
      phrasesPerWord: 3,
    });

    expect(variants).toHaveLength(3);
    expect(variants[0].english).toBe('She is relentless at work.');
    expect(variants.map(sentence => sentence.type)).toEqual(['positive', 'negative', 'past']);
  });

  it('flattens the selected words into builder exercises', () => {
    const exercises = buildBuilderExercises({
      selectedWords: [
        { wordId: 'word-1', wordText: 'relentless', recycled: false },
      ],
      recentSentencesByWord: {
        'word-1': [
          { id: 's1', english: 'I learned relentless today.', portuguese: 'Eu aprendi relentless hoje.', type: 'positive' },
          { id: 's2', english: 'I am not relentless yet.', portuguese: 'Eu ainda nao sou relentless.', type: 'negative' },
          { id: 's3', english: 'We used relentless yesterday.', portuguese: 'Nos usamos relentless ontem.', type: 'past' },
        ],
      },
      builderConfig: {
        phrasesPerWord: 3,
      },
    });

    expect(exercises).toHaveLength(3);
    expect(exercises.every(exercise => exercise.wordId === 'word-1')).toBe(true);
  });
});
