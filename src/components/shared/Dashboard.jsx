import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ACHIEVEMENT_META, XP_PER_LEVEL } from '../../constants/learning.js'
import { isDueToday } from '../../services/srs.js'
import { useCardStore } from '../../store/useCardStore.js'
import {
  calculateRetentionRate,
  calculateStreakStats,
  getDayKey,
  useProgressStore,
} from '../../store/useProgressStore.js'
import { useConfig } from '../../store/useConfig.js'
import { useWordStore } from '../../store/useWordStore.js'
import {
  buildAchievementSpotlight,
  buildAreaPath,
  buildMissionProgress,
  buildPromptCardState,
  buildRange,
  buildSmoothCurve,
  buildTopDashboardStats,
  resolveNextStudyStep,
} from './dashboardMetrics.js'
import { selectDailyPromptTargets } from '../Builder/practiceModes.js'
import NotificationsPopover from './NotificationsPopover.jsx'
import {
  BookIcon,
  BrainIcon,
  FlameIcon,
  MapIcon,
  PencilIcon,
  PlayIcon,
  PuzzleIcon,
  QueueIcon,
  ReloadIcon,
  ReviewIcon,
  SearchIcon,
  ShieldIcon,
  SparkIcon,
  TargetIcon,
  TrophyIcon,
} from './icons.jsx'
import { Badge } from '../ui/badge.jsx'

const missionIcons = {
  readerWords: BookIcon,
  builderExercises: PuzzleIcon,
  flashcardReviews: ReviewIcon,
  productionWrites: PencilIcon,
  recycledWords: ReloadIcon,
}

const achievementIcons = {
  first_discovery: BookIcon,
  builder_apprentice: PuzzleIcon,
  memory_keeper: QueueIcon,
  recycler: ReloadIcon,
  perfect_flow: SparkIcon,
  weekly_rhythm: FlameIcon,
  active_lexicon: TargetIcon,
  prompt_starter: PencilIcon,
}

const STATUS_LABELS = {
  desconhecida: 'Desconhecida',
  reconhecida: 'Reconhecida',
  em_treino: 'Em treino',
  ativa: 'Ativa',
  dominada: 'Dominada',
}

const STEP_META = {
  flashcards: {
    label: 'Revisao em foco',
    headline: 'Revise o que venceu',
    accent: 'e proteja a retencao',
    icon: ReviewIcon,
  },
  practice: {
    label: 'Pratica em foco',
    headline: 'Transforme leitura em pratica',
    accent: 'antes da memoria esfriar',
    icon: SparkIcon,
  },
  reader: {
    label: 'Leitura em foco',
    headline: 'Abra um novo texto',
    accent: 'e capture contexto real',
    icon: BookIcon,
  },
}

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
const MONTH_LABELS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

function formatDashboardDate(date = new Date()) {
  return `${WEEKDAY_LABELS[date.getDay()]}, ${String(date.getDate()).padStart(2, '0')} ${MONTH_LABELS[date.getMonth()]}`
}

function formatStatusLabel(status) {
  return STATUS_LABELS[status] || status
}

function getAchievementCopy(key, fallback = {}) {
  const meta = ACHIEVEMENT_META[key] || {}
  return {
    title: meta.title || fallback.title || 'Marco em andamento',
    desc:
      meta.desc ||
      fallback.description ||
      fallback.desc ||
      'Continue estudando para liberar o proximo marco.',
  }
}

function DashboardIcon({ achievementKey, size = 18 }) {
  const Icon = achievementIcons[achievementKey] || TrophyIcon
  return <Icon size={size} />
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [chartWindow, setChartWindow] = useState(30)
  const { config } = useConfig()
  const { words } = useWordStore()
  const { flashcards } = useCardStore()
  const { dailyStats, dailyPromptHistory, totals, xp, achievements } = useProgressStore()

  const todayKey = getDayKey()
  const todayStats = dailyStats[todayKey] || {}
  const dueCards = flashcards.filter(isDueToday)
  const longTermCards = flashcards.filter((card) => card.interval >= 21).length
  const shortTermCards = flashcards.filter((card) => card.interval > 1 && card.interval < 21).length
  const newCards = flashcards.filter((card) => card.interval <= 1).length
  const missions = buildMissionProgress(config.missions, todayStats)
  const completedMissions = missions.filter((mission) => mission.done).length
  const streakStats = calculateStreakStats(dailyStats, config.study?.minSessionMinutes ?? 5)
  const retention = calculateRetentionRate(dailyStats, 7)
  const activeWords = totals.activeWords || words.filter((word) => word.status === 'ativa').length
  const masteredWords =
    totals.masteredWords || words.filter((word) => word.status === 'dominada').length

  const range = useMemo(() => buildRange(chartWindow), [chartWindow])

  const promptTargets = selectDailyPromptTargets({
    words,
    userLevel: config.userLevel,
    limit: 3,
  })

  const pendingPrompt = !dailyPromptHistory?.[todayKey] && promptTargets.length > 0

  const promptState = buildPromptCardState({
    promptTargets,
    pendingPrompt,
  })

  const nextStep = resolveNextStudyStep({
    dueCards: dueCards.length,
    hasRecentReaderActivity: (todayStats.readerWords || 0) > 0,
    recentSessionWords: promptTargets.length,
    pendingPrompt,
  })

  const heroMeta = STEP_META[nextStep.id] || STEP_META.reader
  const HeroIcon = heroMeta.icon

  const topStats = buildTopDashboardStats({
    completedMissions,
    totalMissions: missions.length,
    dueCards: dueCards.length,
    retentionRate: retention.rate,
    longTermCards,
    shortTermCards,
    newCards,
    currentStreak: streakStats.currentStreak,
    longestStreak: streakStats.longestStreak,
    weeklyActive: streakStats.weeklyActive,
  })

  const spotlight = buildAchievementSpotlight({
    achievements,
    totals,
    dailyStats,
    minSessionMinutes: config.study?.minSessionMinutes ?? 5,
  })

  const spotlightCopy = getAchievementCopy(spotlight.key, spotlight)

  const todayStart = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date.getTime()
  }, [])

  const recentCapturedWords = useMemo(
    () =>
      words
        .filter((word) => (word.lastSeenAt || word.addedAt || 0) >= todayStart)
        .sort(
          (left, right) =>
            (right.lastSeenAt || right.addedAt || 0) - (left.lastSeenAt || left.addedAt || 0),
        )
        .slice(0, 4),
    [todayStart, words],
  )

  const activitySeries = useMemo(
    () =>
      range.map((day) => {
        const stats = dailyStats[day.key] || {}
        return (
          (stats.readerWords || 0) +
          (stats.builderExercises || 0) +
          (stats.transformExercises || 0) +
          (stats.clozeExercises || 0) +
          (stats.flashcardReviews || 0) +
          (stats.productionWrites || 0)
        )
      }),
    [dailyStats, range],
  )

  const chartPath = useMemo(() => buildSmoothCurve(activitySeries, 680, 220), [activitySeries])
  const areaPath = useMemo(() => buildAreaPath(activitySeries, 680, 220), [activitySeries])
  const totalActivity = activitySeries.reduce((sum, value) => sum + value, 0)

  const levelProgress = xp % XP_PER_LEVEL
  const levelProgressPct = Math.round((levelProgress / XP_PER_LEVEL) * 100)
  const currentDate = formatDashboardDate()

  const handlePromptAction = () => {
    if (promptState.action === 'reader') {
      navigate('/reader')
      return
    }
    navigate('/practice', { state: { mode: 'prompt' } })
  }

  return (
    <div className="text-neutral-800 antialiased min-h-screen flex flex-col pt-0 lg:pt-0 pb-16">
      <header className="px-4 md:px-8 h-20 w-full hidden md:flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">Dashboard</h1>
            <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase mt-0.5">
              {currentDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative group hidden lg:block">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-violet-600 transition-colors" />
            <input
              type="text"
              placeholder="Buscar no painel"
              className="pl-10 pr-4 py-2.5 bg-neutral-100 hover:bg-neutral-200/70 focus:bg-white border border-transparent focus:border-violet-300 focus:ring-4 focus:ring-violet-300/30 rounded-full text-sm w-72 transition-all outline-none placeholder-neutral-400"
            />
          </div>

          <div className="relative flex items-center bg-orange-50 border border-orange-100 px-4 py-2 rounded-full gap-2 cursor-pointer hover:bg-orange-100 transition-colors pulse-ring">
            <FlameIcon size={16} className="text-orange-500" />
            <span className="text-sm font-bold text-orange-600">
              {streakStats.currentStreak} dias 🔥
            </span>
          </div>

          <NotificationsPopover />
        </div>
      </header>

      <main className="max-w-[1400px] w-full mt-2 lg:mt-4 mx-auto px-4 md:px-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Hero Widget */}
          <section className="col-span-12 relative bg-white rounded-3xl p-6 md:p-10 shadow-soft border border-neutral-100 overflow-hidden flex items-center justify-between min-h-[400px]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-300/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-pink-100/60 rounded-full blur-3xl translate-y-1/2 opacity-60"></div>

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 mb-6">
                <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                  {heroMeta.label}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-900 leading-tight tracking-tight mb-4 hidden md:block">
                {heroMeta.headline} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 text-gradient-animated">
                  {heroMeta.accent}
                </span>
              </h2>
              <h2 className="text-4xl font-extrabold text-neutral-900 leading-tight tracking-tight mb-4 md:hidden">
                {heroMeta.headline}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600">
                  {heroMeta.accent}
                </span>
              </h2>
              <p className="text-neutral-500 text-lg md:text-xl mb-8 leading-relaxed max-w-md">
                {nextStep.description ||
                  'Importe um texto ou legenda para iniciar o ciclo de estudo de hoje.'}
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(nextStep.route)}
                  className="bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-pink-500/25 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                  <PlayIcon size={20} />
                  {nextStep.cta}
                </button>
              </div>
            </div>

            <div className="hidden md:block relative z-10 w-72 h-72 mr-12">
              <div className="absolute inset-0 bg-white rounded-3xl shadow-xl shadow-violet-600/10 border border-neutral-100 rotate-12 transform hover:rotate-6 transition-transform duration-500 flex items-center justify-center">
                <div className="w-24 h-24 bg-violet-300/30 rounded-2xl flex items-center justify-center text-violet-600">
                  <HeroIcon size={40} />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-3xl shadow-lg rotate-[-8deg] -z-10 opacity-20"></div>
            </div>
          </section>

          {/* Level Widget */}
          <section className="col-span-12 lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 shadow-soft border border-neutral-100 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-3 right-3 flex gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-300/20 text-violet-700 text-[10px] font-bold uppercase tracking-widest">
                🏆 Rank: {config.userLevel}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center shadow-inner-soft text-neutral-400">
                  <ShieldIcon size={32} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                    Panorama do nivel
                  </p>
                  <h3 className="text-2xl font-bold text-neutral-900">
                    Nivel atual {config.userLevel}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {activeWords} palavras ativas e {masteredWords} dominadas.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-4xl font-black text-neutral-900 tracking-tight">{xp}</span>
                </div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                  XP Acumulado
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="w-full bg-neutral-100 rounded-full h-3.5 overflow-hidden border border-neutral-200/50 shadow-inner">
                <div
                  className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-400 h-full rounded-full xp-bar-fill"
                  style={{ width: `${levelProgressPct}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs font-medium text-neutral-500">
                <span>
                  {levelProgress}/{XP_PER_LEVEL} XP
                </span>
                <span>{XP_PER_LEVEL - levelProgress} XP → Nível superior</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-5 pt-5 border-t border-neutral-100">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mr-1">
                Marcos
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mb-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center shadow text-sm">
                    🥉
                  </div>
                  <span className="text-[9px] font-bold text-neutral-400">Bronze</span>
                </div>
                <div className="h-px flex-1 bg-neutral-200 w-6"></div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-400 flex items-center justify-center shadow text-sm">
                    🥈
                  </div>
                  <span className="text-[9px] font-bold text-neutral-400">Prata</span>
                </div>
                <div className="h-px flex-1 bg-neutral-200 w-6"></div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow text-sm">
                    🥇
                  </div>
                  <span className="text-[9px] font-bold text-neutral-400">Ouro</span>
                </div>
                <div className="h-px flex-1 bg-neutral-200 w-6"></div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-300 to-fuchsia-500 flex items-center justify-center shadow text-sm text-white">
                    💎
                  </div>
                  <span className="text-[9px] font-bold text-neutral-400">Platina</span>
                </div>
              </div>
            </div>
          </section>

          {/* Prompt Widget */}
          <section className="col-span-12 lg:col-span-5 bg-white rounded-3xl p-6 md:p-8 shadow-soft border border-neutral-100 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                Daily Prompt
              </p>
              <span
                className={`px-3 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase ${promptState.status === 'empty' ? 'border-violet-300/30 text-violet-700 bg-violet-300/10' : 'border-pink-300 text-pink-600 bg-pink-50'}`}
              >
                {promptState.status === 'empty' ? 'Indisponivel' : 'Pronto'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">
              {promptState.title || 'Pronto para o desafio?'}
            </h3>
            <p className="text-sm text-neutral-500 mb-6">
              {promptState.challenge ||
                promptState.description ||
                'Capture vocabulario no reader para liberar um desafio contextual.'}
            </p>

            <button
              onClick={handlePromptAction}
              className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 w-max shadow-md shadow-violet-600/20"
            >
              <SparkIcon size={16} />
              {promptState.ctaLabel || 'Abrir reader'}
            </button>
          </section>

          {/* Learn Rhythm Chart */}
          <section className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-6 md:p-8 shadow-soft border border-neutral-100 flex flex-col min-h-[420px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                  Ritmo de aprendizado
                </p>
                <h3 className="text-xl font-bold text-neutral-900">Atividade por dia</h3>
              </div>
              <div className="flex items-center bg-neutral-50 p-1 rounded-lg border border-neutral-200">
                <button
                  onClick={() => setChartWindow(7)}
                  className={`px-3 py-1 text-xs ${chartWindow === 7 ? 'font-bold text-neutral-900 bg-white shadow-sm border border-neutral-200' : 'font-medium text-neutral-500 hover:text-neutral-800'} rounded-md`}
                >
                  7d
                </button>
                <button
                  onClick={() => setChartWindow(30)}
                  className={`px-3 py-1 text-xs ${chartWindow === 30 ? 'font-bold text-neutral-900 bg-white shadow-sm border border-neutral-200' : 'font-medium text-neutral-500 hover:text-neutral-800'} rounded-md`}
                >
                  30d
                </button>
                <button
                  onClick={() => setChartWindow(90)}
                  className={`px-3 py-1 text-xs ${chartWindow === 90 ? 'font-bold text-neutral-900 bg-white shadow-sm border border-neutral-200' : 'font-medium text-neutral-500 hover:text-neutral-800'} rounded-md`}
                >
                  90d
                </button>
              </div>
            </div>

            {totalActivity === 0 ? (
              <div className="flex-1 bg-neutral-50/50 border border-neutral-100 rounded-2xl flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage:
                      'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                ></div>
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-neutral-200 flex items-center justify-center text-neutral-300 mb-4 z-10">
                  <MapIcon size={24} />
                </div>
                <p className="font-bold text-neutral-700 mb-1 z-10">Sem atividade nesta janela</p>
                <p className="text-sm text-neutral-500 max-w-sm z-10">
                  Inicie uma sessao para ver seu progresso aqui.
                </p>
              </div>
            ) : (
              <div className="flex-1 relative w-full h-[250px]">
                <svg
                  viewBox="0 0 680 250"
                  className="w-full h-full dashboard-chart-svg"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="dashboardChartGlowV4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(124, 58, 237, 0.24)" />
                      <stop offset="100%" stopColor="rgba(124, 58, 237, 0)" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill="url(#dashboardChartGlowV4)" />
                  <path
                    d={chartPath}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </section>

          {/* Captures & Achievement Panel */}
          <div className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-6">
            <section className="bg-white rounded-3xl p-6 shadow-soft border border-neutral-100 flex flex-col">
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
                Capturas recentes
              </p>

              <div className="flex-1 bg-neutral-50 border border-neutral-100 rounded-2xl flex flex-col items-center justify-center text-center p-4 overflow-y-auto">
                {recentCapturedWords.length > 0 ? (
                  <div className="w-full h-full flex flex-col gap-3 text-left">
                    {recentCapturedWords.map((word) => (
                      <div key={word.id} className="flex justify-between items-center text-sm">
                        <div className="min-w-0 pr-2">
                          <strong className="text-neutral-800">{word.word}</strong>
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                            {word.originalSentence || 'Sem contexto salvo'}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[9px] px-2 py-0.5 whitespace-nowrap bg-white border-neutral-200"
                        >
                          {formatStatusLabel(word.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-neutral-200 flex items-center justify-center text-neutral-300 mb-3">
                      <BookIcon size={20} />
                    </div>
                    <p className="font-bold text-neutral-700 text-sm mb-1">Nenhuma captura hoje</p>
                  </>
                )}
              </div>
            </section>

            <section className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-6 shadow-soft flex flex-col text-white">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">
                  Próxima Conquista
                </p>
                <span className="text-lg">🏆</span>
              </div>
              <p className="text-sm font-bold text-white mb-1">{spotlightCopy.title}</p>
              <p className="text-xs text-white/60 mb-4">{spotlightCopy.desc}</p>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000"
                  style={{ width: `${spotlight.percent}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-white/50 mt-2">
                {spotlight.current}/{spotlight.goal} completo
              </p>

              <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm">
                  📚
                </div>
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm">
                  ⚡
                </div>
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm">
                  🔥
                </div>
                <span className="text-[10px] text-white/50 ml-1">
                  + {achievements.length} conquistas bloqueadas
                </span>
              </div>
            </section>
          </div>

          {/* Missions List */}
          <section className="col-span-12 bg-white rounded-3xl p-6 md:p-8 shadow-soft border border-neutral-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
                  Missões de hoje
                </p>
                <h3 className="text-xl font-bold text-neutral-900">Complete para ganhar XP</h3>
              </div>
              <span className="text-xs font-bold text-neutral-400">
                {completedMissions}/{missions.length} completas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {missions.slice(0, 4).map((mission, idx) => {
                const borderClasses = [
                  'hover:border-violet-300 hover:bg-violet-300/10',
                  'hover:border-orange-300 hover:bg-orange-50/40',
                  'hover:border-fuchsia-300 hover:bg-fuchsia-50/40',
                  'hover:border-pink-300 hover:bg-pink-50/40',
                ]
                const barClasses = [
                  'bg-violet-600',
                  'bg-orange-400',
                  'bg-fuchsia-400',
                  'bg-pink-400',
                ]
                const textClasses = [
                  'text-violet-700',
                  'text-orange-600',
                  'text-fuchsia-600',
                  'text-pink-600',
                ]
                const icons = ['📖', '🔁', '✍️', '🎯']

                const hoverBorder = borderClasses[idx % 4]
                const barColor = barClasses[idx % 4]
                const textColor = textClasses[idx % 4]
                const iconMark = icons[idx % 4]

                const isDone = mission.done
                const percent = Math.min(100, (mission.current / mission.goal) * 100)

                return (
                  <div
                    key={mission.key}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 ${hoverBorder} transition-all cursor-pointer ${isDone ? 'border-solid border-green-300 bg-green-50 shadow-sm' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-xl shadow-sm">
                      {iconMark}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-neutral-800">{mission.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isDone ? 'bg-green-400' : barColor} rounded-full transition-all duration-1000`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span
                          className={`text-[10px] font-bold ${isDone ? 'text-green-600' : textColor}`}
                        >
                          +{mission.xp || 10} XP
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* KPIs Overview */}
          <section className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12">
            <div className="bg-white rounded-3xl p-6 shadow-soft border border-neutral-100 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                  Meta Diária
                </p>
                <div className="p-2 bg-neutral-50 rounded-lg text-neutral-400">
                  <TargetIcon size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-neutral-900 tracking-tight">
                  {topStats.dailyGoal.value}
                </span>
                <span className="text-lg font-medium text-neutral-400">
                  /{topStats.dailyGoal.total}
                </span>
              </div>
              <div className="flex gap-1.5 mt-3">
                <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-violet-600"
                    style={{ width: `${topStats.dailyGoal.percent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-soft border border-neutral-100 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                  Revisões
                </p>
                <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
                  <ReviewIcon size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-neutral-900 tracking-tight">
                  {topStats.pendingReviews.value}
                </span>
              </div>
              <p className="text-[10px] text-orange-500 font-bold mt-2 uppercase">Pendentes Hoje</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-soft border border-neutral-100 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                  Memória
                </p>
                <div className="p-2 bg-violet-300/20 rounded-lg text-violet-700">
                  <BrainIcon size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-neutral-900 tracking-tight">
                  {topStats.retention.value}%
                </span>
              </div>
              <p className="text-[10px] text-violet-700 font-bold mt-2 uppercase">
                Taxa de Restenção
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-soft border border-neutral-100 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-pink-50 rounded-full -translate-y-6 translate-x-6 opacity-60"></div>
              <div className="flex items-start justify-between mb-4">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">
                  Ofensiva
                </p>
                <div className="p-2 bg-pink-50 rounded-lg text-pink-500 badge-bounce">
                  <FlameIcon size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-neutral-900 tracking-tight">
                  {topStats.streak.value}
                </span>
                <span className="text-sm font-bold text-neutral-400 uppercase">Dias</span>
              </div>
              <p className="text-[10px] text-pink-400 font-bold mt-1 z-10">
                🎯 Recorde: {topStats.streak.longestStreak} dias
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
