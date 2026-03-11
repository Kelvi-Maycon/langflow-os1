import { ACHIEVEMENT_META, MISSION_META } from '../../constants/learning.js';
import { getDayKey } from '../../store/useProgressStore.js';

const ACHIEVEMENT_RULES = [
  {
    key: 'first_discovery',
    goal: 1,
    getCurrent: ({ totals }) => totals.readerWords || 0,
    progressLabel: 'palavra capturada',
  },
  {
    key: 'prompt_starter',
    goal: 1,
    getCurrent: ({ totals }) => totals.dailyPrompts || 0,
    progressLabel: 'prompt diario concluido',
  },
  {
    key: 'weekly_rhythm',
    goal: 4,
    getCurrent: ({ dailyStats, minSessionMinutes }) => getStudyDaysInLast(7, dailyStats, minSessionMinutes),
    progressLabel: 'dias ativos na semana',
  },
  {
    key: 'active_lexicon',
    goal: 10,
    getCurrent: ({ totals }) => totals.activeWords || 0,
    progressLabel: 'palavras ativas',
  },
  {
    key: 'builder_apprentice',
    goal: 25,
    getCurrent: ({ totals }) => totals.builderExercises || 0,
    progressLabel: 'exercicios guiados',
  },
  {
    key: 'perfect_flow',
    goal: 10,
    getCurrent: ({ totals }) => totals.perfectBuilds || 0,
    progressLabel: 'acertos de primeira',
  },
  {
    key: 'memory_keeper',
    goal: 20,
    getCurrent: ({ totals }) => totals.savedCards || 0,
    progressLabel: 'cards salvos',
  },
  {
    key: 'recycler',
    goal: 15,
    getCurrent: ({ totals }) => totals.recycledWords || 0,
    progressLabel: 'palavras recicladas',
  },
];

function getStudySecondsForDay(day = {}) {
  if (typeof day.studySeconds === 'number') {
    return day.studySeconds;
  }

  return (
    (day.readerWords || 0) +
    (day.builderExercises || 0) +
    (day.flashcardReviews || 0) +
    (day.productionWrites || 0)
  ) * 60;
}

function getStudyDaysInLast(days, dailyStats = {}, minSessionMinutes = 5) {
  const today = new Date();
  let count = 0;

  for (let i = 0; i < days; i += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const day = dailyStats[getDayKey(date)];
    if (day && getStudySecondsForDay(day) >= minSessionMinutes * 60) {
      count += 1;
    }
  }

  return count;
}

export function buildRange(days = 7) {
  const today = new Date();
  const rows = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    rows.push({
      key: getDayKey(date),
      label: date.toLocaleDateString('pt-BR', { weekday: 'short' }).charAt(0).toUpperCase(),
      isToday: i === 0,
    });
  }
  return rows;
}

export function buildSmoothCurve(values, width = 600, height = 180) {
  if (values.length === 0) return '';
  if (values.length === 1) return `M 0,${height} L ${width},${height}`;

  const max = Math.max(1, ...values);
  const step = width / (values.length - 1);
  const points = values.map((value, index) => ({
    x: index * step,
    y: height - (Math.max(0, value) / max) * height,
  }));

  let path = `M ${points[0].x},${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const cx1 = current.x + (next.x - current.x) * 0.5;
    const cx2 = next.x - (next.x - current.x) * 0.5;
    path += ` C ${cx1},${current.y} ${cx2},${next.y} ${next.x},${next.y}`;
  }

  return path;
}

export function buildAreaPath(values, width = 600, height = 180) {
  if (values.length === 0) return '';

  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => ({
    x: index * step,
    y: height - (Math.max(0, value) / max) * height,
  }));

  return `M 0,${height} ${points.map((point) => `L ${point.x},${point.y}`).join(' ')} L ${width},${height} Z`;
}

export function buildSnapshotSeries(dailyStats, range, snapshotKey = 'masteredWordsSnapshot') {
  let previousValue = 0;

  return range.map((day) => {
    const value = dailyStats?.[day.key]?.[snapshotKey];
    if (typeof value === 'number') {
      previousValue = value;
    }
    return previousValue;
  });
}

export function buildYAxisLabels(values, steps = 4) {
  const max = Math.max(1, ...values);
  const step = Math.max(1, Math.ceil(max / steps));

  return Array.from({ length: steps }, (_, index) => step * (steps - index));
}

export function buildMissionProgress(missionsConfig = {}, todayStats = {}) {
  return MISSION_META.map((mission) => {
    const goal = Math.max(1, missionsConfig?.[mission.key] ?? 1);
    const current = todayStats?.[mission.key] ?? 0;
    const percent = Math.min(100, Math.round((current / goal) * 100));

    return {
      ...mission,
      goal,
      current,
      percent,
      done: current >= goal,
    };
  });
}

export function buildTopDashboardStats({
  completedMissions = 0,
  totalMissions = 0,
  dueCards = 0,
  retentionRate = 0,
  longTermCards = 0,
  shortTermCards = 0,
  newCards = 0,
  currentStreak = 0,
  longestStreak = 0,
  weeklyActive = 0,
} = {}) {
  const missionPercent = totalMissions > 0
    ? Math.round((completedMissions / totalMissions) * 100)
    : 0;

  return {
    dailyGoal: {
      value: completedMissions,
      total: totalMissions,
      percent: missionPercent,
      copy: totalMissions > 0
        ? `${Math.max(0, totalMissions - completedMissions)} blocos restantes`
        : 'Sem missoes configuradas',
    },
    pendingReviews: {
      value: dueCards,
      copy: dueCards === 1 ? '1 revisao para hoje' : `${dueCards} revisoes para hoje`,
    },
    retention: {
      value: retentionRate,
      longTermCards,
      shortTermCards,
      newCards,
    },
    streak: {
      value: currentStreak,
      longestStreak,
      weeklyActive,
    },
  };
}

export function buildPromptCardState({
  promptTargets = [],
  pendingPrompt = false,
} = {}) {
  if (promptTargets.length === 0) {
    return {
      status: 'empty',
      badge: 'Sem alvo',
      title: 'Daily Prompt indisponivel',
      description: 'Capture vocabulario no reader para liberar um desafio diario contextual.',
      challenge: 'Sem termos disponiveis para o prompt de hoje.',
      ctaLabel: 'Abrir reader',
      action: 'reader',
      chips: [],
    };
  }

  if (!pendingPrompt) {
    return {
      status: 'done',
      badge: 'Concluido',
      title: 'Prompt diario concluido',
      description: 'Voce ja fechou o desafio de escrita de hoje e pode revisar ou capturar mais contexto.',
      challenge: `Termos usados hoje: ${promptTargets.map((target) => target.wordText).join(', ')}.`,
      ctaLabel: 'Voltar para pratica',
      action: 'prompt',
      chips: promptTargets.map((target) => target.wordText),
    };
  }

  return {
    status: 'ready',
    badge: '+50 XP',
    title: 'Pratique sua escrita criativa hoje',
    description: 'Use os termos do dia em frases naturais para reforcar producao e contexto.',
    challenge: `Escreva um pequeno texto usando: ${promptTargets.map((target) => target.wordText).join(', ')}.`,
    ctaLabel: 'Abrir prompt',
    action: 'prompt',
    chips: promptTargets.map((target) => target.wordText),
  };
}

export function buildAchievementSpotlight({
  achievements = [],
  totals = {},
  dailyStats = {},
  minSessionMinutes = 5,
} = {}) {
  const unlockedSet = new Set(achievements);
  const candidates = ACHIEVEMENT_RULES.map((rule) => {
    const current = Math.min(
      rule.goal,
      Math.max(
        0,
        rule.getCurrent({
          totals,
          dailyStats,
          minSessionMinutes,
        })
      )
    );
    const percent = Math.min(100, Math.round((current / rule.goal) * 100));
    return {
      key: rule.key,
      ...ACHIEVEMENT_META[rule.key],
      goal: rule.goal,
      current,
      percent,
      progressLabel: rule.progressLabel,
      unlocked: unlockedSet.has(rule.key) || current >= rule.goal,
      remaining: Math.max(0, rule.goal - current),
    };
  });

  const nextLocked = candidates
    .filter((achievement) => !achievement.unlocked)
    .sort((left, right) => {
      if (right.percent !== left.percent) return right.percent - left.percent;
      if (left.remaining !== right.remaining) return left.remaining - right.remaining;
      return left.goal - right.goal;
    })[0];

  if (!nextLocked) {
    return {
      key: 'all_complete',
      icon: 'trophy',
      title: 'Todas as conquistas base liberadas',
      description: 'Voce completou todos os marcos atuais e pode continuar subindo seus numeros diarios.',
      current: achievements.length,
      goal: ACHIEVEMENT_RULES.length,
      percent: 100,
      progressLabel: 'conquistas desbloqueadas',
      unlocked: true,
      tag: '100% liberado',
    };
  }

  return {
    ...nextLocked,
    tag: nextLocked.percent >= 80
      ? 'Quase la'
      : nextLocked.percent > 0
        ? 'Em progresso'
        : 'Proximo marco',
  };
}

export function getAutoAdjustSummary({ enabled, autoAdjustMeta, currentLevel }) {
  if (!enabled) {
    return {
      badge: 'Pausado',
      title: 'Auto-ajuste desativado',
      description: 'Ative o ajuste automatico nas configuracoes para recalibrar a complexidade com base no seu desempenho.',
    };
  }

  if (autoAdjustMeta?.toLevel && autoAdjustMeta?.lastDirection) {
    return {
      badge: autoAdjustMeta.lastDirection === 'up' ? 'Subiu' : 'Simplificou',
      title: `${autoAdjustMeta.fromLevel} -> ${autoAdjustMeta.toLevel}`,
      description: `Ultimo ajuste com ${autoAdjustMeta.accuracy ?? 0}% de acerto na janela de ${autoAdjustMeta.windowSize || 20} exercicios.`,
    };
  }

  if ((autoAdjustMeta?.windowSize || 0) > 0) {
    return {
      badge: 'Monitorando',
      title: `Nivel atual ${currentLevel || 'B1'}`,
      description: `Janela atual: ${autoAdjustMeta.windowSize}/20 exercicios com ${autoAdjustMeta.accuracy ?? 0}% de precisao.`,
    };
  }

  return {
    badge: 'Aguardando',
    title: `Nivel atual ${currentLevel || 'B1'}`,
    description: 'Complete mais exercicios guiados para liberar a primeira recomendacao automatica de nivel.',
  };
}

export function resolveNextStudyStep({
  dueCards = 0,
  hasRecentReaderActivity = false,
  recentSessionWords = 0,
  pendingPrompt = false,
} = {}) {
  if (dueCards > 0) {
    return {
      id: 'flashcards',
      title: 'Revisar cards pendentes',
      description: `${dueCards} ${dueCards === 1 ? 'card pendente' : 'cards pendentes'} para hoje.`,
      cta: 'Abrir revisao',
      route: '/flashcards',
    };
  }

  if (hasRecentReaderActivity || recentSessionWords > 0 || pendingPrompt) {
    return {
      id: 'practice',
      title: 'Transformar leitura em pratica',
      description: 'Use as capturas recentes para abrir uma sessao guiada.',
      cta: 'Continuar pratica',
      route: '/practice',
    };
  }

  return {
    id: 'reader',
    title: 'Capturar vocabulario em contexto',
    description: 'Importe um texto ou legenda para iniciar o ciclo de estudo de hoje.',
    cta: 'Abrir reader',
    route: '/reader',
  };
}
