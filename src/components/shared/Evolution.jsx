import { useMemo } from 'react';
import { BookOpen, Brain, Download, Shield, Sparkles, Trophy, TrendingUp } from 'lucide-react';
import { useCardStore } from '../../store/useCardStore.js';
import { calculateRetentionRate, calculateStreakStats, useProgressStore } from '../../store/useProgressStore.js';
import { useConfig } from '../../store/useConfig.js';
import { useWordStore } from '../../store/useWordStore.js';
import { buildAreaPath, buildRange, buildSmoothCurve, buildSnapshotSeries, buildYAxisLabels } from './dashboardMetrics.js';
import PageHeader from './PageHeader.jsx';
import { Button } from '../ui/button.jsx';
import { Card, CardContent } from '../ui/card.jsx';

const SKILL_LABELS = ['Vocabulário', 'Retenção', 'Precisão', 'Escrita', 'Consistência'];
const SKILL_CENTER = 140;
const SKILL_RADIUS = 82;

function buildSkillPolygon(values, radius = SKILL_RADIUS, center = SKILL_CENTER) {
  const total = values.length;
  return values.map((value, index) => {
    const angle = (-Math.PI / 2) + ((Math.PI * 2) * index) / total;
    const scaled = radius * value;
    const x = center + Math.cos(angle) * scaled;
    const y = center + Math.sin(angle) * scaled;
    return `${x},${y}`;
  }).join(' ');
}

function buildSkillAxis(label, index, total, radius = SKILL_RADIUS, center = SKILL_CENTER) {
  const angle = (-Math.PI / 2) + ((Math.PI * 2) * index) / total;
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
    labelX: center + Math.cos(angle) * (radius + 42),
    labelY: center + Math.sin(angle) * (radius + 42),
    textAnchor: Math.cos(angle) > 0.25 ? 'start' : Math.cos(angle) < -0.25 ? 'end' : 'middle',
    label,
  };
}

function StatCard({ icon: Icon, tone = 'violet', label, value }) {
  const IconComponent = Icon;
  const toneMap = {
    blue: { bg: 'bg-white', icon: 'bg-blue-50 text-blue-500 border-blue-100', text: 'text-neutral-900', shadow: 'shadow-soft' },
    pink: { bg: 'bg-fuchsia-500', icon: 'bg-white/10 text-white border-white/10', text: 'text-white', shadow: 'shadow-none' },
    orange: { bg: 'bg-amber-500', icon: 'bg-white/10 text-white border-white/10', text: 'text-white', shadow: 'shadow-none' },
    green: { bg: 'bg-emerald-500', icon: 'bg-white/10 text-white border-white/10', text: 'text-white', shadow: 'shadow-none' },
    violet: { bg: 'bg-violet-600', icon: 'bg-white/10 text-white border-white/10', text: 'text-white', shadow: 'shadow-lg' }
  };

  const currentTheme = toneMap[tone] || toneMap.violet;

  return (
    <div className={`${currentTheme.bg} rounded-[2rem] p-6 lg:p-8 ${currentTheme.shadow} border ${tone === 'blue' ? 'border-neutral-100' : 'border-transparent'} flex flex-col justify-between relative overflow-hidden group transition-transform hover:-translate-y-1`}>
      {tone !== 'blue' && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none"></div>
      )}
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border mb-6 relative z-10 shadow-inner-soft ${currentTheme.icon}`}>
        <IconComponent className="h-6 w-6" />
      </div>
      <div>
        <div className={`text-[11px] font-bold uppercase tracking-widest opacity-80 mb-2 ${currentTheme.text}`}>{label}</div>
        <div className={`font-display text-4xl md:text-5xl font-black tracking-tight relative z-10 ${currentTheme.text}`}>{value}</div>
      </div>
    </div>
  );
}

export default function Evolution() {
  const { words } = useWordStore();
  const { flashcards } = useCardStore();
  const { config } = useConfig();
  const { xp, dailyStats, totals, achievements } = useProgressStore();

  const range = useMemo(() => buildRange(30), []);
  const engagementSeries = useMemo(
    () => range.map((day) => {
      const stats = dailyStats[day.key] || {};
      return (stats.readerWords || 0)
        + (stats.builderExercises || 0)
        + (stats.flashcardReviews || 0)
        + (stats.productionWrites || 0);
    }),
    [dailyStats, range]
  );
  const engagementPath = useMemo(() => buildSmoothCurve(engagementSeries, 700, 240), [engagementSeries]);
  const engagementArea = useMemo(() => buildAreaPath(engagementSeries, 700, 240), [engagementSeries]);
  const yAxisLabels = useMemo(() => buildYAxisLabels(engagementSeries), [engagementSeries]);

  const masteredSeries = useMemo(() => buildSnapshotSeries(dailyStats, buildRange(14)), [dailyStats]);
  const retention = calculateRetentionRate(dailyStats, 7);
  const streak = calculateStreakStats(dailyStats, config.study?.minSessionMinutes ?? 5);
  const activeWords = totals.activeWords || words.filter((word) => word.status === 'ativa').length;
  const masteredWords = totals.masteredWords || words.filter((word) => word.status === 'dominada').length;
  const learnedWords = words.filter((word) => ['reconhecida', 'em_treino', 'ativa', 'dominada'].includes(word.status)).length;

  const skillValues = [
    Math.min(1, words.length / 25),
    Math.min(1, retention.rate / 100),
    Math.min(1, flashcards.length ? retention.rate / 100 : 0.08),
    Math.min(1, totals.productionWrites / 12),
    Math.min(1, streak.weeklyActive / 7),
  ];
  const skillPolygon = buildSkillPolygon(skillValues);
  const skillAxes = SKILL_LABELS.map((label, index) => buildSkillAxis(label, index, SKILL_LABELS.length));

  const funnel = [
    { label: 'Aprendido', value: learnedWords, tone: 'bg-neutral-200' },
    { label: 'Construção', value: totals.builderExercises, tone: 'bg-primary' },
    { label: 'Revisão', value: totals.flashcardReviews, tone: 'bg-warning' },
    { label: 'Dominadas', value: masteredWords, tone: 'bg-emerald-500' },
  ];
  const funnelMax = Math.max(1, ...funnel.map((item) => item.value));

  return (
        <div className="text-neutral-800 antialiased min-h-screen flex flex-col pt-0 lg:pt-0 pb-16">
            <header className="px-4 md:px-8 h-20 w-full hidden md:flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-3">
                            <TrendingUp size={28} className="text-violet-600" />
                            Dashboard de Evolução
                        </h1>
                        <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase mt-0.5">Visualize seu progresso, histórico de vocabulário e crescimento geral.</p>
                    </div>
                </div>
                <div className="flex items-center">
                    <button className="bg-white text-neutral-900 hover:bg-neutral-50 px-5 py-2.5 rounded-full font-bold shadow-sm border border-neutral-200 transition-transform hover:-translate-y-0.5 flex items-center gap-2">
                        <Download className="h-4 w-4" /> Exportar Relatório
                    </button>
                </div>
            </header>

            <main className="max-w-[1400px] w-full mt-2 lg:mt-4 mx-auto px-4 md:px-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <StatCard icon={BookOpen} tone="blue" label="Palavras" value={words.length} />
                    <StatCard icon={Sparkles} tone="pink" label="Experiência" value={`${xp} XP`} />
                    <StatCard icon={Brain} tone="orange" label="Retenção" value={`${retention.rate}%`} />
                    <StatCard icon={Shield} tone="green" label="Nível CEFR" value={config.userLevel} />
                </div>

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
                    <div className="space-y-8">
                        <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-soft border border-neutral-100 flex flex-col relative overflow-hidden">
                            <div className="mb-8 flex items-start justify-between gap-4 relative z-10">
                                <div>
                                    <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Histórico de Engajamento</div>
                                    <h3 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-900">Consistência diária nos últimos 30 dias</h3>
                                </div>
                                <div className="rounded-xl bg-violet-50 px-4 py-2 text-xs font-bold text-violet-700 border border-violet-100 shadow-inner-soft whitespace-nowrap hidden sm:block">Mês Atual</div>
                            </div>
                            
                            <div className="relative h-[320px] w-full mt-4">
                                <svg viewBox="0 0 700 260" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="evolutionGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="rgba(124, 58, 237, 0.4)" />
                                            <stop offset="100%" stopColor="rgba(124, 58, 237, 0)" />
                                        </linearGradient>
                                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="6" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                    </defs>
                                    <path d={engagementArea} fill="url(#evolutionGlow)" />
                                    <path d={engagementPath} fill="none" stroke="#7C3AED" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
                                </svg>

                                <div className="pointer-events-none absolute inset-y-4 left-0 flex flex-col justify-between text-[10px] font-bold text-neutral-400">
                                    {yAxisLabels.map((label) => (
                                        <span key={label}>{label}</span>
                                    ))}
                                </div>

                                <div className="pointer-events-none absolute bottom-0 left-12 right-0 flex justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                    {range.filter((_, index) => index % 4 === 0).map((day) => (
                                        <span key={day.key}>{day.key.slice(5).replace('-', '/')}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-8 lg:grid-cols-2">
                            <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-soft border border-neutral-100 flex flex-col">
                                <div className="mb-6">
                                    <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Equilíbrio de Habilidades</div>
                                    <h3 className="text-xl font-extrabold tracking-tight text-neutral-900">Visão geral do desempenho</h3>
                                </div>

                                <div className="flex justify-center flex-1 items-center">
                                    <svg viewBox="0 0 280 280" className="h-[260px] w-[260px] overflow-visible drop-shadow-sm">
                                        {[0.25, 0.5, 0.75, 1].map((ratio) => (
                                            <polygon
                                                key={ratio}
                                                points={buildSkillPolygon(Array(SKILL_LABELS.length).fill(ratio))}
                                                fill="none"
                                                stroke="rgba(124, 58, 237, 0.15)"
                                                strokeWidth="1.5"
                                                strokeDasharray={ratio < 1 ? "4 4" : "none"}
                                            />
                                        ))}

                                        {skillAxes.map((axis) => (
                                            <g key={axis.label}>
                                                <line x1={SKILL_CENTER} y1={SKILL_CENTER} x2={axis.x} y2={axis.y} stroke="rgba(124, 58, 237, 0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
                                                <text x={axis.labelX} y={axis.labelY} textAnchor={axis.textAnchor} dominantBaseline="middle" className="fill-neutral-500 text-[10px] uppercase font-bold tracking-wider">
                                                    {axis.label}
                                                </text>
                                            </g>
                                        ))}

                                        <polygon points={skillPolygon} fill="rgba(124, 58, 237, 0.25)" stroke="#7C3AED" strokeWidth="4" strokeLinejoin="round" />
                                        
                                        {skillValues.map((value, index) => {
                                            const angle = (-Math.PI / 2) + ((Math.PI * 2) * index) / SKILL_LABELS.length;
                                            const scaled = SKILL_RADIUS * value;
                                            const x = SKILL_CENTER + Math.cos(angle) * scaled;
                                            const y = SKILL_CENTER + Math.sin(angle) * scaled;
                                            return <circle key={index} cx={x} cy={y} r={4} fill="#fff" stroke="#7C3AED" strokeWidth="2" />;
                                        })}
                                    </svg>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-soft border border-neutral-100 flex flex-col">
                                <div className="mb-8">
                                    <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Funil de Vocabulário</div>
                                    <h3 className="text-xl font-extrabold tracking-tight text-neutral-900">Métricas de transição</h3>
                                </div>

                                <div className="space-y-6 flex-1 flex flex-col justify-center">
                                    {funnel.map((item) => {
                                        const percentage = Math.max(6, (item.value / funnelMax) * 100);
                                        const toneColor = {
                                            'bg-neutral-200': 'bg-neutral-400',
                                            'bg-primary': 'bg-violet-600',
                                            'bg-warning': 'bg-amber-500',
                                            'bg-emerald-500': 'bg-emerald-500'
                                        }[item.tone] || 'bg-violet-500';

                                        return (
                                            <div key={item.label} className="group">
                                                <div className="mb-2 flex items-center justify-between text-sm">
                                                    <span className="font-bold text-neutral-600 uppercase tracking-widest text-[10px]">{item.label}</span>
                                                    <strong className="font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200 shadow-inner-soft text-xs">{item.value}</strong>
                                                </div>
                                                <div className="h-5 overflow-hidden rounded-full bg-neutral-100 border border-neutral-200 shadow-inner-soft">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ease-out ${toneColor} relative overflow-hidden`} style={{ width: `${percentage}%` }}>
                                                        <div className="absolute inset-0 bg-white/20 -skew-x-12 translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-soft border border-neutral-100">
                            <div className="mb-8">
                                <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Marcos Históricos</div>
                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-orange-500 shadow-inner-soft">
                                        <Trophy className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-2xl font-extrabold tracking-tight text-neutral-900">Sua jornada</h3>
                                </div>
                            </div>

                            <p className="mb-8 text-neutral-500 font-medium leading-relaxed">
                                Continue praticando para desbloquear suas primeiras conquistas e ver seu histórico crescer.
                            </p>

                            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-violet-100 before:z-0">
                                <div className={`relative z-10 rounded-[1.5rem] border p-5 shadow-sm transition-transform hover:-translate-y-1 ${words.length > 0 ? 'border-emerald-200 bg-emerald-50' : 'border-neutral-100 bg-white'}`}>
                                    <div className={`text-lg font-extrabold mb-1 ${words.length > 0 ? 'text-emerald-700' : 'text-neutral-900'}`}>Primeiras palavras</div>
                                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{words.length > 0 ? `${words.length} itens adicionados` : 'Adicione vocabulário'}</div>
                                    {words.length > 0 && <div className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-100 border-4 border-white rounded-full flex items-center justify-center shadow-sm"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span></div>}
                                </div>
                                
                                <div className={`relative z-10 rounded-[1.5rem] border p-5 shadow-sm transition-transform hover:-translate-y-1 ${streak.currentStreak > 0 ? 'border-orange-200 bg-orange-50' : 'border-neutral-100 bg-white'}`}>
                                    <div className={`text-lg font-extrabold mb-1 ${streak.currentStreak > 0 ? 'text-orange-700' : 'text-neutral-900'}`}>Ofensiva iniciada</div>
                                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{streak.currentStreak > 0 ? `${streak.currentStreak} dias seguidos` : 'Ative sua primeira streak'}</div>
                                    {streak.currentStreak > 0 && <div className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-100 border-4 border-white rounded-full flex items-center justify-center shadow-sm"><span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span></div>}
                                </div>
                                
                                <div className={`relative z-10 rounded-[1.5rem] border p-5 shadow-sm transition-transform hover:-translate-y-1 ${achievements.length > 0 ? 'border-violet-200 bg-violet-50' : 'border-neutral-100 bg-white'}`}>
                                    <div className={`text-lg font-extrabold mb-1 ${achievements.length > 0 ? 'text-violet-700' : 'text-neutral-900'}`}>Conquista liberada</div>
                                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{achievements.length > 0 ? `${achievements.length} emblemas` : 'Cumpra desafios'}</div>
                                    {achievements.length > 0 && <div className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-violet-100 border-4 border-white rounded-full flex items-center justify-center shadow-sm"><span className="w-2.5 h-2.5 bg-violet-500 rounded-full"></span></div>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-soft border border-neutral-100">
                            <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-6">Insights rápidos</div>
                            
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-[1.5rem] border border-neutral-100 bg-neutral-50/50 p-5 shadow-inner-soft hover:shadow-soft transition-shadow">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-violet-600 mb-2">Vocabulário ativo</div>
                                    <div className="text-3xl font-black tracking-tight text-neutral-900">{activeWords}</div>
                                </div>
                                <div className="rounded-[1.5rem] border border-neutral-100 bg-neutral-50/50 p-5 shadow-inner-soft hover:shadow-soft transition-shadow">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Dominadas</div>
                                    <div className="text-3xl font-black tracking-tight text-neutral-900">{masteredWords}</div>
                                </div>
                                <div className="rounded-[1.5rem] border border-neutral-100 bg-neutral-50/50 p-5 shadow-inner-soft hover:shadow-soft transition-shadow">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-orange-600 mb-2">Retenção semanal</div>
                                    <div className="text-3xl font-black tracking-tight text-neutral-900">{retention.rate}%</div>
                                </div>
                                <div className="rounded-[1.5rem] border border-neutral-100 bg-neutral-50/50 p-5 shadow-inner-soft hover:shadow-soft transition-shadow">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-pink-600 mb-2">Dominadas 14d</div>
                                    <div className="text-3xl font-black tracking-tight text-neutral-900">{masteredSeries.at(-1) ?? 0}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
