import { describe, expect, it } from 'vitest';
import {
  buildAchievementSpotlight,
  buildMissionProgress,
  buildPromptCardState,
  buildSnapshotSeries,
  buildTopDashboardStats,
  getAutoAdjustSummary,
  resolveNextStudyStep,
} from './dashboardMetrics.js';

describe('dashboard metrics helpers', () => {
  it('builds the evolution chart from mastered snapshots and carries the last known value forward', () => {
    const series = buildSnapshotSeries(
      {
        '2026-03-07': { masteredWordsSnapshot: 2, readerWords: 20, builderExercises: 10 },
        '2026-03-09': { masteredWordsSnapshot: 5, readerWords: 1, builderExercises: 1 },
      },
      [
        { key: '2026-03-07' },
        { key: '2026-03-08' },
        { key: '2026-03-09' },
      ]
    );

    expect(series).toEqual([2, 2, 5]);
  });

  it('computes daily missions against the configured goals', () => {
    const progress = buildMissionProgress(
      {
        readerWords: 5,
        builderExercises: 6,
        flashcardReviews: 10,
        productionWrites: 2,
        recycledWords: 3,
      },
      {
        readerWords: 5,
        builderExercises: 4,
        flashcardReviews: 10,
        productionWrites: 1,
        recycledWords: 3,
      }
    );

    expect(progress.filter((mission) => mission.done).map((mission) => mission.key)).toEqual([
      'readerWords',
      'flashcardReviews',
      'recycledWords',
    ]);
    expect(progress.find((mission) => mission.key === 'builderExercises')?.percent).toBe(67);
  });

  it('builds the top dashboard summary stats', () => {
    expect(buildTopDashboardStats({
      completedMissions: 2,
      totalMissions: 5,
      dueCards: 4,
      retentionRate: 60,
      longTermCards: 3,
      shortTermCards: 2,
      newCards: 1,
      currentStreak: 5,
      longestStreak: 8,
      weeklyActive: 4,
    })).toMatchObject({
      dailyGoal: { value: 2, total: 5, percent: 40 },
      pendingReviews: { value: 4 },
      retention: { value: 60, longTermCards: 3, shortTermCards: 2, newCards: 1 },
      streak: { value: 5, longestStreak: 8, weeklyActive: 4 },
    });
  });

  it('builds prompt card states for empty and ready scenarios', () => {
    expect(buildPromptCardState({ promptTargets: [], pendingPrompt: false })).toMatchObject({
      status: 'empty',
      action: 'reader',
    });

    expect(buildPromptCardState({
      promptTargets: [{ wordText: 'careful' }, { wordText: 'despite' }],
      pendingPrompt: true,
    })).toMatchObject({
      status: 'ready',
      action: 'prompt',
      chips: ['careful', 'despite'],
    });
  });

  it('builds the next achievement spotlight from the real achievement progress', () => {
    expect(buildAchievementSpotlight({
      achievements: ['first_discovery'],
      totals: {
        readerWords: 8,
        builderExercises: 6,
        savedCards: 3,
        recycledWords: 1,
        perfectBuilds: 2,
        activeWords: 4,
        dailyPrompts: 0,
      },
      dailyStats: {
        '2026-03-08': { studySeconds: 360 },
        '2026-03-09': { studySeconds: 420 },
      },
      minSessionMinutes: 5,
    })).toMatchObject({
      key: 'active_lexicon',
      title: 'Vocabulário ativo',
      current: 4,
      goal: 10,
      percent: 40,
      progressLabel: 'palavras ativas',
      tag: 'Em progresso',
    });
  });

  it('summarizes the latest auto-adjustment state for the dashboard', () => {
    expect(getAutoAdjustSummary({
      enabled: true,
      currentLevel: 'B2',
      autoAdjustMeta: {
        fromLevel: 'B1',
        toLevel: 'B2',
        lastDirection: 'up',
        accuracy: 95,
        windowSize: 20,
      },
    })).toEqual({
      badge: 'Subiu',
      title: 'B1 -> B2',
      description: 'Ultimo ajuste com 95% de acerto na janela de 20 exercicios.',
    });
  });

  it('prioritizes due reviews, then practice, then reader', () => {
    expect(resolveNextStudyStep({ dueCards: 4 }).id).toBe('flashcards');
    expect(resolveNextStudyStep({ dueCards: 0, recentSessionWords: 3 }).id).toBe('practice');
    expect(resolveNextStudyStep({ dueCards: 0, recentSessionWords: 0, hasRecentReaderActivity: false }).id).toBe('reader');
  });
});
