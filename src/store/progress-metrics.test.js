import { beforeEach, describe, expect, it } from 'vitest';
import { calculateStreakStats, useProgressStore } from './useProgressStore.js';

describe('progress metrics', () => {
  beforeEach(() => {
    useProgressStore.getState().resetProgress();
  });

  it('calculates streaks using the configured minimum session minutes', () => {
    const stats = calculateStreakStats({
      '2026-03-07': { studySeconds: 60 },
      '2026-03-08': { studySeconds: 360 },
      '2026-03-09': { studySeconds: 420 },
    }, 5);

    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(2);
    expect(stats.weeklyActive).toBe(2);
  });

  it('requests an automatic level increase after a strong 20-exercise window', () => {
    let adjustment = null;

    for (let index = 0; index < 20; index += 1) {
      adjustment = useProgressStore.getState().recordBuilderExercise({
        wordId: `word-${index}`,
        firstTry: true,
        recycled: false,
        success: true,
        currentLevel: 'B1',
        autoAdjustEnabled: true,
      });
    }

    expect(adjustment).toEqual({
      from: 'B1',
      to: 'B2',
      direction: 'up',
      accuracy: 100,
    });
    expect(useProgressStore.getState().autoAdjustMeta.toLevel).toBe('B2');
  });

  it('records the daily prompt only once per day', () => {
    const first = useProgressStore.getState().recordDailyPromptCompletion({
      wordIds: ['word-1', 'word-2', 'word-3'],
      answers: ['I achieved it.', 'Despite the rain, we stayed.', 'I would rather wait.'],
      targets: ['achieve', 'despite', 'rather'],
    });
    const second = useProgressStore.getState().recordDailyPromptCompletion({
      wordIds: ['word-1', 'word-2', 'word-3'],
      answers: ['retry 1', 'retry 2', 'retry 3'],
      targets: ['achieve', 'despite', 'rather'],
    });

    expect(first).toEqual({ alreadyCompleted: false, awarded: true });
    expect(second).toEqual({ alreadyCompleted: true });
    expect(useProgressStore.getState().totals.dailyPrompts).toBe(1);
    expect(Object.keys(useProgressStore.getState().dailyPromptHistory)).toHaveLength(1);
  });
});
