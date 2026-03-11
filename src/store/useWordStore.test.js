import { describe, expect, it } from 'vitest';
import { useWordStore } from './useWordStore.js';

describe('word store seed helpers', () => {
  it('imports seed vocabulary without duplicating existing normalized entries', () => {
    const result = useWordStore.getState().importSeedWords([
      { text: 'Make a Decision', cefrLevel: 'B1', entryType: 'collocation', source: 'ngsl' },
      { text: 'make a decision', cefrLevel: 'B1', entryType: 'collocation', source: 'ngsl' },
      { text: 'abundant', cefrLevel: 'B1', entryType: 'word', source: 'ngsl' },
    ]);

    expect(result).toEqual({ added: 2, skipped: 1 });

    const words = useWordStore.getState().words;
    expect(words.map((word) => word.word)).toEqual(['make a decision', 'abundant']);
    expect(words[0]).toMatchObject({
      entryType: 'collocation',
      cefrLevel: 'B1',
      source: 'ngsl',
      isSeeded: true,
    });
  });

  it('removes only unstudied seeded entries', () => {
    const store = useWordStore.getState();
    const seeded = store.importSeedWords([
      { text: 'achieve', cefrLevel: 'B1' },
      { text: 'despite', cefrLevel: 'B1' },
    ]);

    expect(seeded.added).toBe(2);

    const achieve = useWordStore.getState().getWordByText('achieve');
    useWordStore.getState().updateWord(achieve.id, { status: 'reconhecida' });

    const removed = useWordStore.getState().removeUnstudiedSeedWords();
    const remaining = useWordStore.getState().words.map((word) => word.word);

    expect(removed).toBe(1);
    expect(remaining).toEqual(['achieve']);
  });
});
