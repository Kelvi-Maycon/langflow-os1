import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConfig } from '../../store/useConfig.js'
import { useCardStore } from '../../store/useCardStore.js'
import { useWordStore } from '../../store/useWordStore.js'
import { calculateRetentionRate, useProgressStore } from '../../store/useProgressStore.js'
import { useUiStore } from '../../store/useUiStore.js'
import { previewInterval, formatInterval } from '../../services/srs.js'
import PageHeader from '../shared/PageHeader.jsx'
import { BrainIcon, EyeIcon, PlayIcon } from '../shared/icons.jsx'
import { Badge } from '../ui/badge.jsx'

function FlashCard({ card, onRate }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="w-full flex flex-col gap-6">
      <div
        className={`flashcard cursor-pointer group ${flipped ? ' flipped' : ''}`}
        onClick={() => setFlipped((value) => !value)}
        style={{ perspective: '1000px' }}
      >
        <div
          className="flashcard-inner w-full min-h-[320px] rounded-[2rem] shadow-lg relative transition-transform duration-500 will-change-transform"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div
            className="flashcard-face flashcard-front absolute inset-0 w-full h-full bg-white rounded-[2rem] border-2 border-neutral-100 flex flex-col p-8 md:p-12 items-center justify-center text-center shadow-soft"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-[11px] font-bold text-violet-600 uppercase tracking-widest mb-6 px-3 py-1.5 bg-violet-50 rounded-lg border border-violet-100/50">
              Português → Lembre a frase em inglês
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-neutral-900 leading-snug mb-8">
              {card.front}
            </div>
            <div className="mt-auto text-xs font-semibold text-neutral-400 flex items-center gap-2 group-hover:text-violet-500 transition-colors">
              <EyeIcon size={14} /> Clique para revelar
            </div>
          </div>

          <div
            className="flashcard-face flashcard-back absolute inset-0 w-full h-full bg-violet-600 rounded-[2rem] border-2 border-violet-500 flex flex-col p-8 md:p-12 items-center justify-center text-center shadow-xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-50 pointer-events-none"></div>
            <div className="text-[11px] font-bold text-violet-200 uppercase tracking-widest mb-6 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10 relative z-10">
              Inglês → Frase completa
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-white leading-snug mb-8 relative z-10">
              {card.back}
            </div>
            <div className="mt-auto text-xs font-semibold text-violet-300 relative z-10">
              Usar opções abaixo para classificar
            </div>
          </div>
        </div>
      </div>

      {!flipped ? (
        <div className="flex justify-center mt-4">
          <button
            className="bg-neutral-900 text-white hover:bg-black px-10 py-5 rounded-3xl font-black shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-3 text-lg w-full md:w-auto"
            onClick={() => setFlipped(true)}
          >
            <EyeIcon size={20} /> Revelar resposta
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-6 lg:p-8 shadow-soft border border-neutral-100 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-6 text-center">
            Como você se saiu?
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              [
                'nao_lembro',
                'Não lembro',
                'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300',
              ],
              [
                'dificil',
                'Difícil',
                'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300',
              ],
              [
                'bom',
                'Bom',
                'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 hover:border-violet-300',
              ],
              [
                'facil',
                'Fácil',
                'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300',
              ],
            ].map(([rating, label, colorClass]) => (
              <button
                key={rating}
                className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-md ${colorClass}`}
                onClick={() => onRate(rating)}
              >
                <span className="text-sm font-black uppercase tracking-wider mb-2">{label}</span>
                <span className="text-[11px] font-bold opacity-80 bg-white/60 px-2 py-0.5 rounded-md border border-black/5">
                  +{formatInterval(previewInterval(card, rating))}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        <div className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-neutral-200/60">
          Intervalo: {formatInterval(card.interval)}
        </div>
        <div className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-neutral-200/60">
          EF: {(card.easeFactor || 2.5).toFixed(2)}
        </div>
        <div className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-neutral-200/60">
          Revisões: {card.reviewCount || 0}
        </div>
      </div>
    </div>
  )
}

export default function Flashcard() {
  const navigate = useNavigate()
  const { config } = useConfig()
  const { flashcards, getDueCards, getDueCardsSorted, reviewCard } = useCardStore()
  const { promoteFromSRS } = useWordStore()
  const { dailyStats, recordFlashcardReview } = useProgressStore()
  const { publishMilestone, pushToast } = useUiStore()

  const [session, setSession] = useState(null)
  const [current, setCurrent] = useState(0)
  const [sessionResults, setSessionResults] = useState([])
  const [done, setDone] = useState(false)
  const completionAnnouncedRef = useRef(false)

  const dueCards = getDueCardsSorted()
  const dueCount = dueCards.length
  const totalCards = flashcards.length
  const retention = useMemo(() => calculateRetentionRate(dailyStats, 7), [dailyStats])

  const startSession = () => {
    const due = getDueCardsSorted(config.srs?.dailyLimit ?? 20)
    if (due.length === 0) {
      pushToast({
        kind: 'info',
        source: 'flashcards',
        title: 'Sem revisoes pendentes',
        description: 'Hoje voce nao tem cards para revisar.',
      })
      return
    }

    setSession(due)
    setCurrent(0)
    setSessionResults([])
    setDone(false)
    completionAnnouncedRef.current = false
  }

  const handleRate = (rating) => {
    const card = session[current]
    const srsResult = reviewCard(card.id, rating)
    if (card.wordId) {
      promoteFromSRS(card.wordId, srsResult)
      recordFlashcardReview({ wordId: card.wordId, rating })
    }

    setSessionResults((results) => [
      ...results,
      { cardId: card.id, rating, nextInterval: srsResult?.interval },
    ])

    const next = current + 1
    if (next >= session.length) {
      setDone(true)
      return
    }
    setCurrent(next)
  }

  useEffect(() => {
    const handlePageAction = (event) => {
      if (event.detail?.action === 'flashcards-primary' && session === null) {
        startSession()
      }
    }

    window.addEventListener('langflow:page-action', handlePageAction)
    return () => window.removeEventListener('langflow:page-action', handlePageAction)
  }, [session, dueCount])

  useEffect(() => {
    if (!done || completionAnnouncedRef.current || sessionResults.length === 0) {
      return
    }

    completionAnnouncedRef.current = true
    publishMilestone({
      kind: 'success',
      source: 'flashcards',
      title: 'Revisao diaria concluida',
      description: `${sessionResults.length} cards revisados nesta sessao.`,
    })
  }, [done, publishMilestone, sessionResults.length])

  if (session === null) {
    return (
      <div className="text-neutral-800 antialiased min-h-screen flex flex-col pt-0 lg:pt-0 pb-16">
        <header className="px-4 md:px-8 h-20 w-full hidden md:flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-3">
                <BrainIcon size={28} className="text-violet-600" />
                Flashcards SRS
              </h1>
              <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase mt-0.5">
                Revise os cards do dia e mantenha o ciclo de longo prazo em movimento.
              </p>
            </div>
          </div>
        </header>

        <main className="max-w-[1400px] w-full mt-2 lg:mt-4 mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-soft border border-neutral-100 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-violet-50/50 to-transparent pointer-events-none"></div>
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
                Pendentes hoje
              </div>
              <div
                className={`text-5xl font-black ${dueCount > 0 ? 'text-violet-600' : 'text-neutral-300'}`}
              >
                {dueCount}
              </div>
            </div>
            <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-soft border border-neutral-100 flex flex-col justify-between relative overflow-hidden">
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
                Total de cards
              </div>
              <div className="text-5xl font-black text-neutral-900">{totalCards}</div>
            </div>
            <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-soft border border-neutral-100 flex flex-col justify-between relative overflow-hidden">
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
                Retenção 7d
              </div>
              <div className="text-5xl font-black text-emerald-500">{retention.rate}%</div>
            </div>
          </div>

          {totalCards === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 shadow-soft border border-neutral-100 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400 mb-6 border border-neutral-200 shadow-inner-soft">
                <BrainIcon size={36} />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">Nenhum flashcard ainda</h3>
              <p className="text-neutral-500 max-w-md">
                Salve frases no builder para abrir sua primeira fila de revisão.
              </p>
              <div className="flex gap-4 flex-wrap mt-8">
                <button
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-8 py-3.5 rounded-full font-bold shadow-lg transition-transform hover:-translate-y-0.5"
                  onClick={() => navigate('/practice')}
                >
                  Ir para prática
                </button>
                <button
                  className="bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 px-8 py-3.5 rounded-full font-bold shadow-sm transition-transform hover:-translate-y-0.5"
                  onClick={() => navigate('/reader')}
                >
                  Voltar ao reader
                </button>
              </div>
            </div>
          ) : dueCount === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 shadow-soft border border-neutral-100 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6 border border-emerald-100 shadow-inner-soft">
                <BrainIcon size={36} />
              </div>
              <h2 className="text-3xl font-extrabold text-neutral-900 mb-3">Tudo em dia</h2>
              <p className="text-neutral-500 max-w-md">
                Nenhuma revisão pendente hoje. Capture um novo texto ou crie mais cards no builder.
              </p>
              <div className="flex gap-4 flex-wrap mt-8">
                <button
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-8 py-3.5 rounded-full font-bold shadow-lg transition-transform hover:-translate-y-0.5"
                  onClick={() => navigate('/reader')}
                >
                  Abrir reader
                </button>
                <button
                  className="bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 px-8 py-3.5 rounded-full font-bold shadow-sm transition-transform hover:-translate-y-0.5"
                  onClick={() => navigate('/practice')}
                >
                  Abrir prática
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
              <div className="bg-violet-600 rounded-[2rem] p-8 text-white shadow-lg relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-50 pointer-events-none"></div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-12 backdrop-blur-sm border border-white/10">
                  <PlayIcon size={24} className="text-white fill-current" />
                </div>
                <div className="mt-auto">
                  <h3 className="text-4xl font-black tracking-tight mb-2">
                    {dueCount} {dueCount === 1 ? 'card' : 'cards'}
                  </h3>
                  <p className="text-violet-200 font-medium mb-8">
                    Sessão estimada: ~{Math.max(1, Math.round(dueCount * 1.5))} min
                  </p>
                  <button
                    className="w-full bg-white text-violet-900 hover:bg-neutral-50 px-8 py-4 rounded-full font-extrabold shadow-lg transition-transform hover:-translate-y-1 flex items-center justify-center gap-2"
                    onClick={startSession}
                  >
                    Iniciar revisão
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4 px-2">
                  <EyeIcon size={12} /> Próximos cards
                </div>
                <div className="flex flex-col gap-3">
                  {dueCards.slice(0, 5).map((card) => (
                    <div
                      key={card.id}
                      className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-soft hover:border-violet-200 transition-colors flex flex-col gap-2 relative overflow-hidden"
                    >
                      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-violet-50/50 to-transparent pointer-events-none"></div>
                      <div className="text-sm font-bold text-neutral-900 relative z-10">
                        {card.front}
                      </div>
                      <div className="text-xs font-semibold text-neutral-500 relative z-10">
                        {card.back}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  if (done) {
    const counts = { nao_lembro: 0, dificil: 0, bom: 0, facil: 0 }
    sessionResults.forEach((result) => {
      counts[result.rating] += 1
    })

    return (
      <div className="text-neutral-800 antialiased min-h-screen flex flex-col pt-0 lg:pt-0 pb-16">
        <header className="px-4 md:px-8 h-20 w-full hidden md:flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-3">
                <BrainIcon size={28} className="text-violet-600" />
                Flashcards SRS
              </h1>
              <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase mt-0.5">
                Sessão concluída
              </p>
            </div>
          </div>
        </header>

        <main className="max-w-[800px] w-full mt-2 lg:mt-8 mx-auto px-4 md:px-8 text-center">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-8 mx-auto border border-green-100 shadow-inner-soft">
            <BrainIcon size={40} />
          </div>

          <h2 className="text-4xl font-extrabold text-neutral-900 mb-4 tracking-tight">
            Sessão concluída
          </h2>
          <p className="text-lg text-neutral-500 mb-12">
            Você revisou {sessionResults.length} cards.
          </p>

          <div className="bg-white rounded-[2rem] p-8 shadow-soft border border-neutral-100 mb-10 text-left">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-6">
              Resultado da sessão
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ['Não lembro', counts.nao_lembro, 'text-red-500', 'bg-red-50'],
                ['Difícil', counts.dificil, 'text-amber-500', 'bg-amber-50'],
                ['Bom', counts.bom, 'text-violet-600', 'bg-violet-50'],
                ['Fácil', counts.facil, 'text-emerald-500', 'bg-emerald-50'],
              ].map(([label, count, colorClass, bgClass]) => (
                <div
                  key={label}
                  className={`${bgClass} rounded-2xl p-6 text-center border border-white/50 shadow-inner-soft`}
                >
                  <div className={`text-3xl font-black mb-2 ${colorClass}`}>{count}</div>
                  <div className="text-[11px] font-bold text-neutral-600 uppercase tracking-widest">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4 flex-wrap">
            <button
              className="bg-neutral-900 text-white hover:bg-black px-8 py-3.5 rounded-full font-bold shadow-sm transition-transform hover:-translate-y-0.5"
              onClick={() => setSession(null)}
            >
              Voltar ao painel
            </button>
            <button
              className="bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 px-8 py-3.5 rounded-full font-bold shadow-sm transition-transform hover:-translate-y-0.5"
              onClick={() => navigate('/reader')}
            >
              Ler
            </button>
            <button
              className="bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 px-8 py-3.5 rounded-full font-bold shadow-sm transition-transform hover:-translate-y-0.5"
              onClick={() => navigate('/practice')}
            >
              Praticar
            </button>
          </div>
        </main>
      </div>
    )
  }

  const card = session[current]
  const progress = Math.round((current / session.length) * 100)

  return (
    <div className="text-neutral-800 antialiased min-h-screen flex flex-col pt-0 lg:pt-0 pb-16">
      <header className="px-4 md:px-8 h-20 w-full hidden md:flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-3">
              <BrainIcon size={28} className="text-violet-600" />
              Flashcards SRS
            </h1>
            <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase mt-0.5">
              Card {current + 1} de {session.length}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-[800px] w-full mt-2 lg:mt-8 mx-auto px-4 md:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 text-sm font-bold">
            <span className="text-neutral-500">Progresso</span>
            <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-violet-200">
              {progress}%
            </span>
          </div>
          <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/50">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <FlashCard key={card.id} card={card} onRate={handleRate} />

        <div className="flex justify-center mt-12">
          <button
            className="text-sm font-bold text-neutral-400 hover:text-neutral-600 underline underline-offset-4"
            onClick={() => setDone(true)}
          >
            Encerrar sessão antecipadamente
          </button>
        </div>
      </main>
    </div>
  )
}
