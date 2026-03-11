import { describe, expect, it } from 'vitest';
import {
  buildClozeExercises,
  buildTransformExercises,
  selectDailyPromptTargets,
} from './practiceModes.js';

describe('builder practice modes', () => {
  it('creates deterministic sentence transform pairs from cached variants', () => {
    const exercises = buildTransformExercises({
      selectedWords: [
        { wordId: 'word-1', wordText: 'relentless', recycled: false },
      ],
      recentSentencesByWord: {
        'word-1': [
          { id: 'p', english: 'She is relentless at work.', portuguese: 'Ela e incansavel no trabalho.', type: 'positive' },
          { id: 'n', english: 'She is not relentless at work.', portuguese: 'Ela nao e incansavel no trabalho.', type: 'negative' },
          { id: 't', english: 'She was relentless at work.', portuguese: 'Ela foi incansavel no trabalho.', type: 'past' },
        ],
      },
      builderConfig: { phrasesPerWord: 3 },
    });

    expect(exercises.map((exercise) => exercise.id)).toEqual([
      'word-1_positive_negative',
      'word-1_positive_past',
      'word-1_negative_positive',
    ]);
    expect(exercises[1].expectedSentence).toBe('She was relentless at work.');
  });

  it('creates cloze exercises for words and collocations', () => {
    const exercises = buildClozeExercises({
      selectedWords: [
        { wordId: 'word-1', wordText: 'make a decision', recycled: true },
      ],
      recentSentencesByWord: {
        'word-1': [
          { id: 'p', english: 'We need to make a decision today.', portuguese: 'Precisamos tomar uma decisao hoje.', type: 'positive' },
        ],
      },
      builderConfig: { phrasesPerWord: 1 },
    });

    expect(exercises).toHaveLength(1);
    expect(exercises[0].maskedEnglish).toContain('_____');
    expect(exercises[0].expectedText).toBe('make a decision');
    expect(exercises[0].recycled).toBe(true);
  });

  it('prioritizes daily prompt targets by active, training and seeded vocabulary', () => {
    const targets = selectDailyPromptTargets({
      userLevel: 'B1',
      limit: 3,
      words: [
        { id: '1', word: 'achieve', status: 'ativa', isSeeded: false, entryType: 'word' },
        { id: '2', word: 'despite', status: 'em_treino', isSeeded: false, entryType: 'word' },
        { id: '3', word: 'make a decision', status: 'desconhecida', isSeeded: true, cefrLevel: 'B1', entryType: 'collocation' },
        { id: '4', word: 'rather', status: 'desconhecida', isSeeded: false, entryType: 'word' },
      ],
    });

    expect(targets.map((target) => target.wordId)).toEqual(['1', '2', '3']);
    expect(targets[2].entryType).toBe('collocation');
  });
});
