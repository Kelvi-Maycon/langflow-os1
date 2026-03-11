import { useMemo, useState } from 'react';
import { BookOpen, Download, Search, Sparkles, Trash2, Upload, WandSparkles } from 'lucide-react';
import { useConfig } from '../../store/useConfig.js';
import { useWordStore } from '../../store/useWordStore.js';
import { getSeedEntriesForLevel } from '../../data/ngslSeed.js';
import { WORD_STATUS_META } from '../../constants/learning.js';
import PageHeader from '../shared/PageHeader.jsx';
import { Badge } from '../ui/badge.jsx';
import { Button } from '../ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card.jsx';
import { Input } from '../ui/input.jsx';
import { Textarea } from '../ui/textarea.jsx';

function StatCard({ label, value, tone = 'default' }) {
  const toneMap = {
    default: { bg: 'bg-white', icon: 'bg-neutral-50 text-neutral-400 border-neutral-100', text: 'text-neutral-900' },
    purple: { bg: 'bg-violet-600', icon: 'bg-white/10 text-white border-white/10', text: 'text-white' },
    pink: { bg: 'bg-fuchsia-500', icon: 'bg-white/10 text-white border-white/10', text: 'text-white' },
    orange: { bg: 'bg-amber-500', icon: 'bg-white/10 text-white border-white/10', text: 'text-white' },
  };

  const currentTheme = toneMap[tone];

  return (
    <div className={`${currentTheme.bg} rounded-[2rem] p-6 lg:p-8 shadow-soft border ${tone === 'default' ? 'border-neutral-100' : 'border-transparent'} flex flex-col justify-between relative overflow-hidden group`}>
      {tone !== 'default' && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none"></div>
      )}
      <div className={`text-[11px] font-bold uppercase tracking-widest mb-4 opacity-80 ${currentTheme.text}`}>{label}</div>
      <div className={`text-4xl md:text-5xl font-black ${currentTheme.text} relative z-10`}>{value}</div>
    </div>
  );
}

function VocabularyRow({ word, onRemove }) {
  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 border border-neutral-100 shadow-sm hover:border-violet-200 hover:shadow-soft transition-all group flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="text-xl md:text-2xl font-extrabold tracking-tight text-neutral-900 group-hover:text-violet-700 transition-colors">{word.word}</div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-neutral-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500 border border-neutral-200/60 shadow-inner-soft">
              {word.entryType === 'collocation' ? 'Collocation' : 'Word'}
            </span>
            <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest border shadow-inner-soft ${WORD_STATUS_META[word.status].badgeClass}`}>
              {WORD_STATUS_META[word.status].label}
            </span>
            {word.cefrLevel && (
              <span className="rounded-md bg-violet-50 border border-violet-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-600 shadow-inner-soft">
                {word.cefrLevel}
              </span>
            )}
          </div>
        </div>

        <button className="text-[11px] font-bold text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 self-start" onClick={() => onRemove(word.id)}>
          <Trash2 className="h-3.5 w-3.5" /> Remover
        </button>
      </div>

      <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 text-sm font-medium text-neutral-600 shadow-inner-soft">
        {word.originalSentence
          ? `${word.originalSentence.slice(0, 180)}${word.originalSentence.length > 180 ? '...' : ''}`
          : 'Sem frase de contexto salva ainda.'}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400 font-semibold pt-2 border-t border-neutral-50/80">
        <span className="uppercase tracking-widest text-[10px]">{word.source || 'manual'}{word.isSeeded ? ' · seeded' : ''}</span>
        <strong className="font-bold text-neutral-600 bg-white px-2 py-1 rounded-md border border-neutral-100 shadow-sm">✅ {word.correctCount ?? word.dragCorrectCount ?? 0} <span className="mx-1 opacity-30 text-neutral-300">|</span> ❌ {word.errorCount ?? word.dragWrongCount ?? 0}</strong>
      </div>
    </div>
  );
}

export default function Vocabulary() {
  const { config } = useConfig();
  const {
    words,
    addWord,
    addManyWords,
    importSeedWords,
    removeUnstudiedSeedWords,
    removeWord,
  } = useWordStore();

  const [newWord, setNewWord] = useState('');
  const [bulkWords, setBulkWords] = useState('');
  const [bulkFeedback, setBulkFeedback] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [entryType, setEntryType] = useState('word');

  const collocationCount = useMemo(() => words.filter((item) => item.entryType === 'collocation').length, [words]);
  const seededCount = useMemo(() => words.filter((item) => item.isSeeded).length, [words]);

  const filteredWords = useMemo(
    () => words.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (search && !item.word.includes(search.toLowerCase())) return false;
      return true;
    }),
    [filter, search, words]
  );

  const handleAddWord = () => {
    if (!newWord.trim()) return;
    addWord(newWord.trim(), { entryType, tag: 'manual', source: 'manual' });
    setNewWord('');
  };

  const handleBulkAdd = () => {
    const entries = bulkWords
      .split(/[\n,]+/)
      .map((word) => word.trim())
      .filter(Boolean);

    if (entries.length === 0) {
      setBulkFeedback({ type: 'warning', text: 'Nenhuma palavra válida encontrada para importar.' });
      return;
    }

    const result = addManyWords(entries, {
      tag: 'bulk',
      entryType,
      source: 'manual',
    });

    setBulkFeedback({
      type: result.added > 0 ? 'success' : 'warning',
      text: `${result.added} adicionadas · ${result.skipped} ignoradas por duplicidade ou valor vazio.`,
    });

    if (result.added > 0) setBulkWords('');
  };

  const handleSeedImport = (through = false) => {
    const entries = getSeedEntriesForLevel(config.userLevel, { through });
    const result = importSeedWords(entries);

    setBulkFeedback({
      type: result.added > 0 ? 'success' : 'warning',
      text: through
        ? `${result.added} itens seed importados até ${config.userLevel} · ${result.skipped} ignorados.`
        : `${result.added} itens seed importados para ${config.userLevel} · ${result.skipped} ignorados.`,
    });
  };

  const handleClearSeed = () => {
    const removed = removeUnstudiedSeedWords();
    setBulkFeedback({
      type: removed > 0 ? 'success' : 'warning',
      text: removed > 0
        ? `${removed} itens seed sem progresso foram removidos.`
        : 'Nenhum item seed sem progresso para remover.',
    });
  };

  return (
        <div className="text-neutral-800 antialiased min-h-screen flex flex-col pt-0 lg:pt-0 pb-16">
            <header className="px-4 md:px-8 h-20 w-full hidden md:flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-3">
                            <BookOpen size={28} className="text-violet-600" />
                            Vocabulário
                        </h1>
                        <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase mt-0.5">Gerencie palavras, collocations, seed NGSL e o banco que alimenta Reader, Builder e revisão.</p>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] w-full mt-2 lg:mt-4 mx-auto px-4 md:px-8">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <StatCard label="Itens no banco" value={words.length} tone="default" />
                    <StatCard label="Seed NGSL" value={seededCount} tone="purple" />
                    <StatCard label="Collocations" value={collocationCount} tone="pink" />
                    <StatCard label="Ativas" value={words.filter((item) => item.status === 'ativa').length} tone="orange" />
                </div>

                <div className="grid gap-8 lg:grid-cols-[400px_minmax(0,1fr)]">
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl p-6 shadow-soft border border-neutral-100 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none"></div>
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 relative z-10">Adicionar manualmente</div>
                            <h3 className="text-xl font-bold text-neutral-900 mb-6 relative z-10">Entrada rápida</h3>
                            
                            <div className="space-y-4 relative z-10">
                                <Input
                                    className="w-full bg-neutral-50/50 border-neutral-200 focus:border-violet-500 rounded-xl px-4 py-3 shadow-inner-soft"
                                    placeholder="Adicionar palavra ou expressão..."
                                    value={newWord}
                                    onChange={(event) => setNewWord(event.target.value)}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter') handleAddWord();
                                    }}
                                />

                                <select className="w-full bg-neutral-50/50 border border-neutral-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm font-semibold outline-none shadow-inner-soft" value={entryType} onChange={(event) => setEntryType(event.target.value)}>
                                    <option value="word">Palavra</option>
                                    <option value="collocation">Collocation</option>
                                </select>

                                <button className="w-full bg-neutral-900 text-white hover:bg-black px-6 py-3.5 rounded-xl font-bold shadow-sm transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2" onClick={handleAddWord}>
                                    <Sparkles className="h-4 w-4" />
                                    Adicionar
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 shadow-soft border border-neutral-100 flex flex-col relative overflow-hidden">
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Upload em lote</div>
                            <h3 className="text-xl font-bold text-neutral-900 mb-3">Importação rápida</h3>
                            <p className="text-xs font-semibold text-neutral-500 mb-4 leading-relaxed">
                                Cole palavras ou expressões separadas por vírgula ou quebra de linha. Duplicados serão ignorados.
                            </p>
                            
                            <div className="space-y-4">
                                <Textarea
                                    className="w-full min-h-[140px] bg-neutral-50/50 border-neutral-200 focus:border-violet-500 rounded-2xl p-4 text-sm outline-none resize-none shadow-inner-soft"
                                    placeholder={entryType === 'collocation'
                                      ? 'make a decision\npay attention\nrather than'
                                      : 'abundant, diligent, relentless\npursuit\nachievement'}
                                    value={bulkWords}
                                    onChange={(event) => setBulkWords(event.target.value)}
                                />
                                <div className="flex gap-3">
                                    <button className="flex-1 bg-neutral-900 text-white hover:bg-black px-4 py-3 rounded-xl font-bold shadow-sm transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2" onClick={handleBulkAdd}>
                                        <Upload className="h-4 w-4" /> Importar
                                    </button>
                                    <button className="px-5 py-3 rounded-xl font-bold text-neutral-500 border border-neutral-200 hover:bg-neutral-50 transition-colors" onClick={() => { setBulkWords(''); setBulkFeedback(null); }}>
                                        Limpar
                                    </button>
                                </div>
                                {bulkFeedback && (
                                    <div className={`mt-2 p-3 rounded-xl text-xs font-bold leading-tight flex items-center gap-2 ${bulkFeedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                                        {bulkFeedback.text}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none"></div>
                            <div className="text-[10px] font-bold text-violet-200 uppercase tracking-widest mb-1 relative z-10">Banco seed</div>
                            <h3 className="text-xl font-bold text-white mb-6 relative z-10">NGSL por nível</h3>
                            
                            <div className="space-y-3 relative z-10 flex flex-col">
                                <button className="w-full bg-white text-violet-900 hover:bg-neutral-50 px-4 py-3.5 rounded-xl font-bold shadow-md transition-transform hover:-translate-y-0.5 flex items-center justify-start gap-3" onClick={() => handleSeedImport(false)}>
                                    <WandSparkles className="h-4 w-4 text-violet-500" />
                                    Importar nível atual ({config.userLevel})
                                </button>
                                <button className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/20 px-4 py-3.5 rounded-xl font-bold transition-transform hover:-translate-y-0.5 flex items-center justify-start gap-3" onClick={() => handleSeedImport(true)}>
                                    <Download className="h-4 w-4" />
                                    Importar até o nível atual
                                </button>
                                <button className="w-full bg-black/20 text-white/90 hover:bg-black/30 text-xs mt-2 px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2" onClick={handleClearSeed}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Limpar seed sem progresso
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-soft border border-neutral-100 flex flex-col">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div>
                                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Banco atual</div>
                                    <h3 className="text-2xl font-extrabold text-neutral-900">Explorar e filtrar</h3>
                                </div>
                            </div>
                            
                            <div className="grid gap-3 md:grid-cols-[1fr_200px] mb-8 pb-8 border-b border-neutral-100">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        className="w-full min-h-[52px] bg-neutral-50/50 border border-neutral-200 focus:border-violet-500 rounded-2xl pl-12 pr-4 text-sm font-semibold outline-none shadow-inner-soft transition-colors"
                                        placeholder="Buscar por termo..."
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value.toLowerCase())}
                                    />
                                </div>
                                <select className="w-full min-h-[52px] bg-neutral-50/50 border border-neutral-200 focus:border-violet-500 rounded-2xl px-4 text-sm font-semibold outline-none shadow-inner-soft cursor-pointer transition-colors" value={filter} onChange={(event) => setFilter(event.target.value)}>
                                    <option value="all">Todos os status</option>
                                    <option value="desconhecida">Desconhecida</option>
                                    <option value="reconhecida">Reconhecida</option>
                                    <option value="em_treino">Em treino</option>
                                    <option value="ativa">Ativa</option>
                                    <option value="dominada">Dominada</option>
                                </select>
                            </div>

                            <div className="space-y-4">
                                {filteredWords.length > 0 ? (
                                    filteredWords.map((word) => (
                                        <VocabularyRow key={word.id} word={word} onRemove={removeWord} />
                                    ))
                                ) : (
                                    <div className="bg-neutral-50 border border-neutral-200/60 border-dashed rounded-[2rem] p-12 text-center flex flex-col items-center">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-neutral-400 mb-4 shadow-sm border border-neutral-100">
                                            <Search className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-lg font-bold text-neutral-800 mb-2">Nenhum termo encontrado</h3>
                                        <p className="text-sm font-semibold text-neutral-400">Tente buscar por outras palavras ou remover os filtros ativos.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
