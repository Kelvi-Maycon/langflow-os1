import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useConfig } from '../../store/useConfig.js';
import { useWordStore } from '../../store/useWordStore.js';
import { useCardStore } from '../../store/useCardStore.js';
import { useProgressStore } from '../../store/useProgressStore.js';
import { useUiStore } from '../../store/useUiStore.js';
import { generateSentences } from '../../services/ai.js';
import { containsLexiconText, normalizeLexiconText } from '../../utils/lexicon.js';
import { shuffle } from '../../utils/shuffle.js';
import { buildBuilderExercises, selectBuilderWords } from './session.js';
import { buildClozeExercises, buildTransformExercises, selectDailyPromptTargets } from './practiceModes.js';
import PageHeader from '../shared/PageHeader.jsx';
import { EyeIcon, PencilIcon, PlayIcon, PuzzleIcon, ReloadIcon, SparkIcon } from '../shared/icons.jsx';

const AI_WARMUP_TIMEOUT_MS = 5000;
const AVAILABLE_CONTAINER_ID = 'builder-available';
const ANSWER_CONTAINER_ID = 'builder-answer';
const PRACTICE_MODES = [
    { id: 'assembly', label: 'Montagem' },
    { id: 'transform', label: 'Transform' },
    { id: 'cloze', label: 'Cloze' },
    { id: 'prompt', label: 'Prompt' },
];

function normalizeEnglishAnswer(value) {
    return String(value || '')
        .normalize('NFKC')
        .replace(/[’`]/g, '\'')
        .replace(/[.,!?;:"]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function createOrderedTokenItems(sentenceId, english) {
    return String(english || '')
        .replace(/[.,!?;:"]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .map((text, index) => ({
            id: `${sentenceId}_${index}_${text.toLowerCase()}`,
            text,
        }));
}

function createShuffledTokenItems(sentenceId, english) {
    return shuffle(createOrderedTokenItems(sentenceId, english));
}

function getTokenContainer(activeId, availableTokens, answerTokens) {
    if (availableTokens.some((token) => token.id === activeId)) return AVAILABLE_CONTAINER_ID;
    if (answerTokens.some((token) => token.id === activeId)) return ANSWER_CONTAINER_ID;
    return null;
}

function moveTokenBetweenContainers({
    sourceContainer,
    targetContainer,
    activeId,
    overId,
    availableTokens,
    answerTokens,
}) {
    const sourceItems = sourceContainer === AVAILABLE_CONTAINER_ID ? availableTokens : answerTokens;
    const targetItems = targetContainer === AVAILABLE_CONTAINER_ID ? availableTokens : answerTokens;
    const activeIndex = sourceItems.findIndex((token) => token.id === activeId);

    if (activeIndex === -1) {
        return { availableTokens, answerTokens };
    }

    const activeToken = sourceItems[activeIndex];
    const nextSourceItems = sourceItems.filter((token) => token.id !== activeId);

    let targetIndex = targetItems.findIndex((token) => token.id === overId);
    if (overId === targetContainer || targetIndex === -1) {
        targetIndex = targetItems.length;
    }

    const nextTargetItems = [...targetItems];
    nextTargetItems.splice(targetIndex, 0, activeToken);

    if (sourceContainer === AVAILABLE_CONTAINER_ID) {
        return {
            availableTokens: nextSourceItems,
            answerTokens: nextTargetItems,
        };
    }

    return {
        availableTokens: nextTargetItems,
        answerTokens: nextSourceItems,
    };
}

function getAnswerFeedback(answerTokens, expectedTokens) {
    return expectedTokens.map((expected, index) => answerTokens[index]?.text?.toLowerCase() === expected.text.toLowerCase());
}

function SortableChip({ token, tone = 'default', onClick, disabled = false }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: token.id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.75 : 1,
    };

    return (
        <button
            ref={setNodeRef}
            type="button"
            style={style}
            className={`chip${tone === 'placed' ? ' placed' : ''}${tone === 'correct' ? ' correct' : ''}${tone === 'wrong' ? ' wrong' : ''}`}
            onClick={onClick}
            {...attributes}
            {...listeners}
        >
            {token.text}
        </button>
    );
}

function SortableLane({
    containerId,
    tokens,
    onTokenClick,
    emptyCopy,
    toneById = {},
    disabled = false,
    testId,
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: containerId,
        disabled,
    });

    return (
        <div
            ref={setNodeRef}
            className={`drop-zone${isOver ? ' drag-over' : ''}`}
            data-container-id={containerId}
            data-testid={testId}
        >
            <SortableContext items={tokens.map((token) => token.id)} strategy={rectSortingStrategy}>
                {tokens.length === 0 && <span className="placeholder">{emptyCopy}</span>}
                {tokens.map((token) => (
                    <SortableChip
                        key={token.id}
                        token={token}
                        tone={toneById[token.id] || 'default'}
                        onClick={() => onTokenClick(token.id)}
                        disabled={disabled}
                    />
                ))}
            </SortableContext>
        </div>
    );
}

function applyGuidedPracticeResult({
    config,
    setConfig,
    markBuilderResult,
    recordBuilderExercise,
    wordId,
    recycled,
    success,
    firstTry,
    mode,
}) {
    markBuilderResult(wordId, { correct: success });
    const adjustment = recordBuilderExercise({
        wordId,
        firstTry,
        recycled,
        success,
        currentLevel: config.userLevel,
        autoAdjustEnabled: config.autoAdjustDifficulty,
        mode,
    });

    if (adjustment?.to) {
        setConfig({ userLevel: adjustment.to });
    }

    return adjustment;
}

function SentenceExercise({ exercise, onComplete, onSave }) {
    const { markBuilderResult } = useWordStore();
    const { recordBuilderExercise, recordProductionWrite } = useProgressStore();
    const { config, setConfig } = useConfig();

    const expectedTokens = useMemo(
        () => createOrderedTokenItems(`expected_${exercise.sentence.id}`, exercise.sentence.english),
        [exercise.sentence.english, exercise.sentence.id]
    );
    const [availableTokens, setAvailableTokens] = useState(() => createShuffledTokenItems(exercise.sentence.id, exercise.sentence.english));
    const [answerTokens, setAnswerTokens] = useState([]);
    const [result, setResult] = useState(null);
    const [attempts, setAttempts] = useState(0);
    const [production, setProduction] = useState('');
    const [showProd, setShowProd] = useState(false);
    const [saved, setSaved] = useState(false);
    const maxAttempts = 3;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const resetFeedback = () => {
        if (result === 'try_again') {
            setResult(null);
        }
    };

    const moveToAnswer = (tokenId) => {
        setAvailableTokens((currentAvailable) => {
            const token = currentAvailable.find((item) => item.id === tokenId);
            if (!token) return currentAvailable;
            setAnswerTokens((currentAnswer) => [...currentAnswer, token]);
            return currentAvailable.filter((item) => item.id !== tokenId);
        });

        if (result.alreadyCompleted) {
            pushToast({
                kind: 'info',
                source: 'builder',
                title: 'Prompt ja enviado',
                description: 'O desafio diario dessa data ja tinha sido concluido.',
            });
            setFeedback({ type: 'info', text: 'Prompt de hoje jÃ¡ havia sido concluÃ­do.' });
            return;
        }

        publishMilestone({
            kind: 'success',
            source: 'builder',
            title: 'Prompt diario concluido',
            description: 'As frases do dia foram registradas no seu progresso.',
        });
        resetFeedback();
    };

    const moveToAvailable = (tokenId) => {
        setAnswerTokens((currentAnswer) => {
            const token = currentAnswer.find((item) => item.id === tokenId);
            if (!token) return currentAnswer;
            setAvailableTokens((currentAvailable) => [...currentAvailable, token]);
            return currentAnswer.filter((item) => item.id !== tokenId);
        });
        resetFeedback();
    };

    const finalizeAttempt = (correct, newAttempts) => {
        if (correct) {
            setResult('correct');
            applyGuidedPracticeResult({
                config,
                setConfig,
                markBuilderResult,
                recordBuilderExercise,
                wordId: exercise.wordId,
                recycled: exercise.recycled,
                success: true,
                firstTry: newAttempts === 1,
                mode: 'assembly',
            });
            setShowProd(true);
            return;
        }

        if (newAttempts >= maxAttempts) {
            setResult('incorrect');
            setAnswerTokens(expectedTokens);
            setAvailableTokens([]);
            applyGuidedPracticeResult({
                config,
                setConfig,
                markBuilderResult,
                recordBuilderExercise,
                wordId: exercise.wordId,
                recycled: exercise.recycled,
                success: false,
                firstTry: false,
                mode: 'assembly',
            });
            setShowProd(true);
            return;
        }

        setResult('try_again');
    };

    const checkAnswer = () => {
        if (answerTokens.length === 0) return;
        const answer = answerTokens.map((token) => token.text).join(' ');
        const correct = normalizeEnglishAnswer(answer) === normalizeEnglishAnswer(exercise.sentence.english);
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        finalizeAttempt(correct, newAttempts);
    };

    const revealAnswer = () => {
        const newAttempts = Math.max(attempts + 1, maxAttempts);
        setAttempts(newAttempts);
        finalizeAttempt(false, newAttempts);
    };

    const handleSave = () => {
        if (saved) return;
        if (production.trim()) {
            recordProductionWrite({ wordId: exercise.wordId });
        }
        setSaved(true);
        onSave({
            sentenceId: exercise.sentence.id,
            wordId: exercise.wordId,
            wordText: exercise.wordText,
            front: exercise.sentence.portuguese,
            back: exercise.sentence.english,
            production,
        });
    };

    const handleDragEnd = ({ active, over }) => {
        if (!over || !active?.id) return;

        const sourceContainer = getTokenContainer(active.id, availableTokens, answerTokens);
        const targetContainer = over.id === AVAILABLE_CONTAINER_ID || over.id === ANSWER_CONTAINER_ID
            ? over.id
            : getTokenContainer(over.id, availableTokens, answerTokens);

        if (!sourceContainer || !targetContainer) return;
        resetFeedback();

        if (sourceContainer === targetContainer) {
            const items = sourceContainer === AVAILABLE_CONTAINER_ID ? availableTokens : answerTokens;
            const oldIndex = items.findIndex((token) => token.id === active.id);
            const newIndex = items.findIndex((token) => token.id === over.id);
            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

            const reordered = arrayMove(items, oldIndex, newIndex);
            if (sourceContainer === AVAILABLE_CONTAINER_ID) {
                setAvailableTokens(reordered);
            } else {
                setAnswerTokens(reordered);
            }
            return;
        }

        const nextState = moveTokenBetweenContainers({
            sourceContainer,
            targetContainer,
            activeId: active.id,
            overId: over.id,
            availableTokens,
            answerTokens,
        });

        setAvailableTokens(nextState.availableTokens);
        setAnswerTokens(nextState.answerTokens);
    };

    const answerFeedback = result === 'try_again' || result === 'incorrect'
        ? getAnswerFeedback(answerTokens, expectedTokens)
        : [];
    const answerTones = Object.fromEntries(
        answerTokens.map((token, index) => {
            if (result !== 'try_again' && result !== 'incorrect') return [token.id, 'placed'];
            return [token.id, answerFeedback[index] ? 'correct' : 'wrong'];
        })
    );

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-soft border border-neutral-100 flex flex-col gap-6 relative overflow-hidden">
            <div className="bg-violet-50 p-5 rounded-2xl border border-violet-100/50 mb-2 relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-violet-100/50 to-transparent pointer-events-none"></div>
                <div className="text-[11px] font-bold text-violet-600 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <SparkIcon size={12} /> Traduza para o inglês
                </div>
                <div className="text-xl md:text-2xl font-bold text-violet-950 leading-tight">{exercise.sentence.portuguese}</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
                <div className="flex flex-col gap-4">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest px-2">Monte a frase correta</label>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableLane
                            containerId={ANSWER_CONTAINER_ID}
                            tokens={answerTokens}
                            onTokenClick={moveToAvailable}
                            toneById={answerTones}
                            emptyCopy="Clique ou arraste palavras para montar a frase."
                            disabled={result === 'correct' || result === 'incorrect'}
                            testId="builder-answer-lane"
                        />
                        <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest px-2 mt-4">Banco de palavras</label>
                        <SortableLane
                            containerId={AVAILABLE_CONTAINER_ID}
                            tokens={availableTokens}
                            onTokenClick={moveToAnswer}
                            emptyCopy="Todas as palavras já foram usadas."
                            disabled={result === 'correct' || result === 'incorrect'}
                            testId="builder-bank-lane"
                        />
                    </DndContext>
                </div>

                <div className="bg-neutral-50/80 rounded-2xl p-6 border border-neutral-200/60 shadow-inner-soft self-stretch flex flex-col pt-5">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4">
                        <PencilIcon size={12} /> Dica de montagem
                    </div>
                    <div className="text-sm font-medium text-neutral-600 bg-white p-3 rounded-xl border border-neutral-100 shadow-sm mb-3">
                        Ordem esperada: <strong>{expectedTokens.length}</strong> palavras
                    </div>
                    <div className="text-sm text-neutral-500 bg-white p-3 rounded-xl border border-neutral-100 shadow-sm mb-3 leading-relaxed">
                        Palavra foco:<br />
                        <strong className="text-violet-700">{exercise.wordText}</strong> <span className="opacity-50">·</span> variação <strong>{exercise.sentence.type}</strong>
                    </div>
                    <div className="text-xs font-semibold text-neutral-400 mt-auto bg-neutral-200/50 p-3 rounded-xl">
                        Tentativas usadas: <strong className={attempts >= maxAttempts ? 'text-red-500' : 'text-neutral-700'}>{attempts}</strong> / {maxAttempts}
                    </div>
                </div>
            </div>

            {result === 'correct' && (
                <div className="builder-feedback builder-feedback-success mt-lg">
                    <div className="builder-feedback-title">✅ Resposta correta</div>
                    <div className="builder-feedback-text">{exercise.sentence.english}</div>
                </div>
            )}

            {result === 'try_again' && (
                <div className="builder-feedback builder-feedback-warning mt-lg" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                    <div className="builder-feedback-title" style={{ color: '#D97706' }}>⚠️ Ainda nao ficou certo</div>
                    <div className="builder-feedback-copy" style={{ color: '#D97706', marginTop: 4 }}>
                        Revise a ordem das palavras destacadas. Você tem mais {maxAttempts - attempts} {maxAttempts - attempts === 1 ? 'tentativa' : 'tentativas'}.
                    </div>
                </div>
            )}

            {result === 'incorrect' && (
                <div className="builder-feedback builder-feedback-error mt-lg">
                    <div className="builder-feedback-title">❌ Resposta encerrada</div>
                    <div className="builder-feedback-text">
                        A frase correta era: <strong>{exercise.sentence.english}</strong>
                    </div>
                </div>
            )}

            {(!result || result === 'try_again') && (
                <div className="flex gap-sm mt-lg">
                    <button className="btn btn-primary" onClick={checkAnswer}>
                        <span className="btn-icon"><SparkIcon size={15} /></span>
                        <span>Verificar</span>
                    </button>
                    <button
                        className="btn btn-ghost"
                        onClick={() => {
                            setAvailableTokens(createShuffledTokenItems(exercise.sentence.id, exercise.sentence.english));
                            setAnswerTokens([]);
                            resetFeedback();
                        }}
                    >
                        Limpar
                    </button>
                    {attempts > 0 && (
                        <button className="btn btn-ghost" onClick={revealAnswer} style={{ color: 'var(--c-muted)' }}>
                            <span className="btn-icon"><EyeIcon size={15} /></span>
                            <span>Revelar resposta</span>
                        </button>
                    )}
                </div>
            )}

            {showProd && (
                <div className="mt-lg builder-production">
                    <label className="input-label builder-production-label">
                        ✍️ Agora use essa palavra numa frase sua (opcional):
                    </label>
                    <div className="builder-production-copy">
                        Now use <strong>{exercise.wordText}</strong> in your own sentence.
                    </div>
                    <textarea
                        className="textarea"
                        style={{ minHeight: 80, fontSize: 14 }}
                        placeholder="Type your own sentence here..."
                        value={production}
                        onChange={(event) => setProduction(event.target.value)}
                    />
                </div>
            )}

            {result && result !== 'try_again' && (
                <div className="flex gap-sm mt-lg flex-wrap">
                    <button className="btn btn-primary" onClick={handleSave} disabled={saved}>
                        {saved ? 'Salvo no Flashcard' : 'Salvar no Flashcard'}
                    </button>
                    <button className="btn btn-outline" onClick={onComplete}>Próxima →</button>
                </div>
            )}
        </div>
    );
}

function TransformExercise({ exercise, onComplete }) {
    const { markBuilderResult } = useWordStore();
    const { recordBuilderExercise } = useProgressStore();
    const { config, setConfig } = useConfig();
    const [answer, setAnswer] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [result, setResult] = useState(null);
    const maxAttempts = 3;

    const finalizeAttempt = (success, nextAttempts) => {
        if (success) {
            setResult('correct');
            applyGuidedPracticeResult({
                config,
                setConfig,
                markBuilderResult,
                recordBuilderExercise,
                wordId: exercise.wordId,
                recycled: exercise.recycled,
                success: true,
                firstTry: nextAttempts === 1,
                mode: 'transform',
            });
            return;
        }

        if (nextAttempts >= maxAttempts) {
            setResult('incorrect');
            applyGuidedPracticeResult({
                config,
                setConfig,
                markBuilderResult,
                recordBuilderExercise,
                wordId: exercise.wordId,
                recycled: exercise.recycled,
                success: false,
                firstTry: false,
                mode: 'transform',
            });
            return;
        }

        setResult('try_again');
    };

    const handleVerify = () => {
        const nextAttempts = attempts + 1;
        const success = normalizeEnglishAnswer(answer) === normalizeEnglishAnswer(exercise.expectedSentence);
        setAttempts(nextAttempts);
        finalizeAttempt(success, nextAttempts);
    };

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-soft border border-neutral-100 flex flex-col gap-6">
            <div className="bg-violet-50 p-5 rounded-2xl border border-violet-100/50 mb-2">
                <div className="text-[11px] font-bold text-violet-600 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <RefreshCwIcon size={12} /> Transformação Estrutural
                </div>
                <div className="text-xl md:text-2xl font-bold text-violet-950 leading-tight">{exercise.instruction}</div>
            </div>

            <div className="bg-neutral-50/80 rounded-2xl p-6 border border-neutral-200/60 shadow-inner-soft">
                <div className="flex items-center gap-2 text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Frase base</div>
                <div className="text-lg font-bold text-neutral-800 bg-white p-4 rounded-xl border border-neutral-100 shadow-sm mb-2">{exercise.sourceSentence}</div>
                <div className="text-sm font-medium text-neutral-500 px-2 italic">{exercise.sourcePortuguese}</div>
            </div>

            <div className="mt-2">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest px-2 mb-2 block">Digite a nova frase em inglês</label>
                <textarea
                    className="w-full p-4 bg-white border border-neutral-200 hover:border-neutral-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl text-base transition-all outline-none resize-none shadow-sm"
                    style={{ minHeight: 120 }}
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Reescreva a frase aqui conforme a instrução..."
                />
            </div>

            {result === 'try_again' && (
                <div className="builder-feedback builder-feedback-warning mt-lg" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                    <div className="builder-feedback-title" style={{ color: '#D97706' }}>⚠️ Ainda nao ficou certo</div>
                    <div className="builder-feedback-copy" style={{ color: '#D97706', marginTop: 4 }}>
                        Compare a transformação pedida com a frase base e tente novamente.
                    </div>
                </div>
            )}

            {result === 'correct' && (
                <div className="builder-feedback builder-feedback-success mt-lg">
                    <div className="builder-feedback-title">✅ Transformação correta</div>
                    <div className="builder-feedback-text">{exercise.expectedSentence}</div>
                </div>
            )}

            {result === 'incorrect' && (
                <div className="builder-feedback builder-feedback-error mt-lg">
                    <div className="builder-feedback-title">❌ Tentativas encerradas</div>
                    <div className="builder-feedback-text">{exercise.expectedSentence}</div>
                </div>
            )}

            {(!result || result === 'try_again') && (
                <div className="flex gap-sm mt-lg">
                    <button className="btn btn-primary" onClick={handleVerify} disabled={!answer.trim()}>✓ Verificar</button>
                    <button className="btn btn-ghost" onClick={() => setAnswer('')}>Limpar</button>
                </div>
            )}

            {result && result !== 'try_again' && (
                <div className="flex gap-sm mt-lg">
                    <button className="btn btn-outline" onClick={onComplete}>Próxima →</button>
                </div>
            )}
        </div>
    );
}

function ClozeExercise({ exercise, onComplete }) {
    const { markBuilderResult } = useWordStore();
    const { recordBuilderExercise } = useProgressStore();
    const { config, setConfig } = useConfig();
    const [answer, setAnswer] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [result, setResult] = useState(null);
    const maxAttempts = 3;

    const finalizeAttempt = (success, nextAttempts) => {
        if (success) {
            setResult('correct');
            applyGuidedPracticeResult({
                config,
                setConfig,
                markBuilderResult,
                recordBuilderExercise,
                wordId: exercise.wordId,
                recycled: exercise.recycled,
                success: true,
                firstTry: nextAttempts === 1,
                mode: 'cloze',
            });
            return;
        }

        if (nextAttempts >= maxAttempts) {
            setResult('incorrect');
            applyGuidedPracticeResult({
                config,
                setConfig,
                markBuilderResult,
                recordBuilderExercise,
                wordId: exercise.wordId,
                recycled: exercise.recycled,
                success: false,
                firstTry: false,
                mode: 'cloze',
            });
            return;
        }

        setResult('try_again');
    };

    const handleVerify = () => {
        const nextAttempts = attempts + 1;
        const success = normalizeLexiconText(answer) === normalizeLexiconText(exercise.expectedText);
        setAttempts(nextAttempts);
        finalizeAttempt(success, nextAttempts);
    };

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-soft border border-neutral-100 flex flex-col gap-6">
            <div className="bg-violet-50 p-5 rounded-2xl border border-violet-100/50 mb-2">
                <div className="text-[11px] font-bold text-violet-600 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <TypeIcon size={12} /> Preencha a Lacuna (Cloze)
                </div>
                <div className="text-xl md:text-2xl font-bold text-violet-950 leading-tight">{exercise.portuguese}</div>
            </div>

            <div className="bg-neutral-50/80 rounded-2xl p-8 border border-neutral-200/60 shadow-inner-soft text-center">
                <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-4">Complete com a palavra certa</div>
                <div className="text-2xl font-black text-neutral-900 leading-normal">{exercise.maskedEnglish}</div>
            </div>

            <div className="mt-2 text-center max-w-lg mx-auto w-full">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest px-2 mb-2 block">Palavra ou expressão faltante</label>
                <input
                    className="w-full px-6 py-4 bg-white border border-neutral-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl text-lg font-bold text-center transition-all outline-none shadow-sm placeholder-neutral-300"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Digite a resposta aqui..."
                />
            </div>

            {result === 'try_again' && (
                <div className="builder-feedback builder-feedback-warning mt-lg" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                    <div className="builder-feedback-title" style={{ color: '#D97706' }}>⚠️ Ainda nao ficou certo</div>
                    <div className="builder-feedback-copy" style={{ color: '#D97706', marginTop: 4 }}>
                        Revise a palavra foco e tente completar novamente.
                    </div>
                </div>
            )}

            {result === 'correct' && (
                <div className="builder-feedback builder-feedback-success mt-lg">
                    <div className="builder-feedback-title">✅ Lacuna correta</div>
                    <div className="builder-feedback-text">{exercise.english}</div>
                </div>
            )}

            {result === 'incorrect' && (
                <div className="builder-feedback builder-feedback-error mt-lg">
                    <div className="builder-feedback-title">❌ Resposta correta</div>
                    <div className="builder-feedback-text">{exercise.expectedText}</div>
                </div>
            )}

            {(!result || result === 'try_again') && (
                <div className="flex gap-sm mt-lg">
                    <button className="btn btn-primary" onClick={handleVerify} disabled={!answer.trim()}>✓ Verificar</button>
                    <button className="btn btn-ghost" onClick={() => setAnswer('')}>Limpar</button>
                </div>
            )}

            {result && result !== 'try_again' && (
                <div className="flex gap-sm mt-lg">
                    <button className="btn btn-outline" onClick={onComplete}>Próxima →</button>
                </div>
            )}
        </div>
    );
}

function DailyPromptPanel({ targets }) {
    const { recordDailyPromptCompletion, dailyPromptHistory } = useProgressStore();
    const { publishMilestone, pushToast } = useUiStore();
    const todayKey = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
    const existingSubmission = dailyPromptHistory?.[todayKey] || null;
    const [answers, setAnswers] = useState(() => targets.map(() => ''));
    const [feedback, setFeedback] = useState(existingSubmission ? { type: 'info', text: 'Prompt de hoje já concluído.' } : null);

    const handleSubmit = () => {
        if (existingSubmission) {
            setFeedback({ type: 'info', text: 'Prompt de hoje já foi enviado.' });
            return;
        }

        if (answers.some((answer) => !answer.trim())) {
            setFeedback({ type: 'warning', text: 'Preencha as 3 frases antes de enviar.' });
            return;
        }

        const invalidIndex = answers.findIndex((answer, index) => !containsLexiconText(answer, targets[index]?.wordText));
        if (invalidIndex !== -1) {
            setFeedback({
                type: 'warning',
                text: `A frase ${invalidIndex + 1} precisa usar o termo "${targets[invalidIndex].wordText}".`,
            });
            return;
        }

        const result = recordDailyPromptCompletion({
            wordIds: targets.map((target) => target.wordId),
            answers,
            targets: targets.map((target) => target.wordText),
        });

        setFeedback(result.alreadyCompleted
            ? { type: 'info', text: 'Prompt de hoje já havia sido concluído.' }
            : { type: 'success', text: 'Prompt diário concluído. XP e progresso registrados.' });
    };

    if (targets.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>Nenhum termo disponível</h3>
                <p>Adicione palavras ao banco ou importe o seed do seu nível para desbloquear o desafio diário.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] p-6 lg:p-10 shadow-soft border border-neutral-100 mb-8 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-violet-50/80 to-transparent pointer-events-none"></div>
            
            <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 mb-6 w-max shadow-inner-soft">
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-violet-700 uppercase tracking-widest">Daily Prompt</span>
                </div>
                <h3 className="text-3xl font-extrabold text-neutral-900 mb-2 tracking-tight">Escreva 3 frases usando os termos do dia.</h3>
                <p className="text-sm text-neutral-500 max-w-xl mb-8">Essa prática vale bastante XP e consolida o vocabulário recente.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {targets.map((target, index) => (
                    <div key={target.wordId} className="bg-neutral-50/80 rounded-2xl p-6 border border-neutral-200/60 shadow-inner-soft hover:border-violet-200 transition-colors group">
                        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1 group-hover:text-violet-500 transition-colors">Termo {index + 1}</div>
                        <div className="text-xl font-bold text-neutral-900 group-hover:text-violet-700 transition-colors">{target.wordText}</div>
                        <div className="mt-2 text-xs font-semibold text-neutral-500 bg-white px-3 py-1.5 rounded-lg border border-neutral-100 shadow-sm inline-block">
                            {target.entryType === 'collocation' ? 'Use a expressão inteira na frase.' : 'Use a palavra em uma frase natural.'}
                        </div>
                        <textarea
                            className="w-full mt-4 p-4 bg-white border border-neutral-200 hover:border-neutral-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-xl text-sm transition-all outline-none resize-none shadow-sm disabled:opacity-60 disabled:bg-neutral-50"
                            style={{ minHeight: 110 }}
                            disabled={Boolean(existingSubmission)}
                            value={answers[index] || ''}
                            onChange={(event) => {
                                const nextAnswers = [...answers];
                                nextAnswers[index] = event.target.value;
                                setAnswers(nextAnswers);
                            }}
                            placeholder={`Exemplo com "${target.wordText}"...`}
                        />
                    </div>
                ))}
            </div>

            {feedback && (
                <div className={`mt-6 p-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm relative z-10 ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : feedback.type === 'info' ? 'bg-violet-50 text-violet-700 border border-violet-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                    {feedback.text}
                </div>
            )}

            <div className="flex justify-center mt-8 relative z-10">
                <button 
                    className="bg-neutral-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-bold shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3" 
                    onClick={handleSubmit} 
                    disabled={Boolean(existingSubmission)}
                >
                    <SparkIcon size={18} className={!existingSubmission ? 'text-violet-300' : ''} />
                    Enviar Prompt do Dia
                </button>
            </div>
        </div>
    );
}

function renderModeSummary({ title, copy, actionLabel, onReset, secondaryAction }) {
    return (
        <div className="bg-white rounded-3xl p-12 shadow-soft border border-neutral-100 flex flex-col items-center justify-center text-center mt-4">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-6 border border-green-100 shadow-inner-soft">
                <SparkIcon size={36} />
            </div>
            <h2 className="text-3xl font-extrabold text-neutral-900 mb-3 tracking-tight">{title}</h2>
            <p className="text-neutral-500 max-w-md">{copy}</p>

            <div className="flex justify-center gap-4 flex-wrap mt-8">
                <button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-8 py-3.5 rounded-full font-bold shadow-lg transition-transform hover:-translate-y-0.5" onClick={onReset}>{actionLabel}</button>
                {secondaryAction}
            </div>
        </div>
    );
}

export default function Builder({ initialWords = [], initialMode = 'assembly', onDone }) {
    const { config } = useConfig();
    const { words: bankWords } = useWordStore();
    const { addFlashcard, addSentences, getRecentSentencesByWord } = useCardStore();
    const { autoAdjustMeta, recordCardSaved } = useProgressStore();
    const { publishMilestone, pushToast } = useUiStore();

    const [phase, setPhase] = useState('loading');
    const [mode, setMode] = useState(initialMode);
    const [practiceData, setPracticeData] = useState({
        selectedWords: [],
        assemblyExercises: [],
        transformExercises: [],
        clozeExercises: [],
        promptTargets: [],
    });
    const [saved, setSaved] = useState([]);
    const [error, setError] = useState(null);
    const [assemblyIndex, setAssemblyIndex] = useState(0);
    const [transformIndex, setTransformIndex] = useState(0);
    const [clozeIndex, setClozeIndex] = useState(0);
    const didInitRef = useRef(false);
    const warmControllersRef = useRef([]);
    const workspaceRef = useRef(null);
    const completionFlagsRef = useRef({ assembly: false, transform: false, cloze: false });
    const autoAdjustMarkerRef = useRef(null);
    const builderConfig = useMemo(() => config.builder || {}, [config.builder]);

    const abortWarmups = useCallback(() => {
        warmControllersRef.current.forEach((controller) => controller.abort());
        warmControllersRef.current = [];
    }, []);

    const prepare = useCallback(() => {
        abortWarmups();
        setPhase('loading');
        setError(null);

        try {
            const selectedWords = selectBuilderWords({
                initialWords,
                bankWords,
                builderConfig,
            });

            const recentSentencesByWord = Object.fromEntries(
                selectedWords.map((word) => [
                    word.wordId,
                    getRecentSentencesByWord(word.wordId, builderConfig.phrasesPerWord ?? 3),
                ])
            );

            const nextData = {
                selectedWords,
                assemblyExercises: buildBuilderExercises({
                    selectedWords,
                    recentSentencesByWord,
                    builderConfig,
                }),
                transformExercises: buildTransformExercises({
                    selectedWords,
                    recentSentencesByWord,
                    builderConfig,
                }),
                clozeExercises: buildClozeExercises({
                    selectedWords,
                    recentSentencesByWord,
                    builderConfig,
                }),
                promptTargets: selectDailyPromptTargets({
                    words: bankWords,
                    userLevel: config.userLevel,
                    limit: 3,
                }),
            };

            setPracticeData(nextData);
            setSaved([]);
            setAssemblyIndex(0);
            setTransformIndex(0);
            setClozeIndex(0);
            completionFlagsRef.current = { assembly: false, transform: false, cloze: false };
            setPhase('ready');

            if (config.provider) {
                void (async () => {
                    for (const word of selectedWords) {
                        const cached = recentSentencesByWord[word.wordId] || [];
                        if (cached.length >= (builderConfig.phrasesPerWord ?? 3)) continue;

                        const controller = new AbortController();
                        const timer = window.setTimeout(() => controller.abort(), AI_WARMUP_TIMEOUT_MS);
                        warmControllersRef.current.push(controller);

                        try {
                            const result = await generateSentences({
                                word: word.wordText,
                                originalSentence: word.originalSentence,
                                userLevel: config.userLevel || 'B1',
                                config,
                                signal: controller.signal,
                            });

                            addSentences(
                                result.sentences.map((sentence) => ({
                                    ...sentence,
                                    wordId: word.wordId,
                                    wordText: word.wordText,
                                }))
                            );
                        } catch {
                            // Keep local fallback for current session.
                        } finally {
                            window.clearTimeout(timer);
                            warmControllersRef.current = warmControllersRef.current.filter((item) => item !== controller);
                        }
                    }
                })();
            }
        } catch (caughtError) {
            setError(caughtError.message);
            setPracticeData({
                selectedWords: [],
                assemblyExercises: [],
                transformExercises: [],
                clozeExercises: [],
                promptTargets: [],
            });
            setPhase('ready');
        }
    }, [abortWarmups, addSentences, bankWords, builderConfig, config, getRecentSentencesByWord, initialWords]);

    useEffect(() => {
        if (didInitRef.current) return;
        didInitRef.current = true;
        prepare();
    }, [prepare]);

    useEffect(() => {
        setMode(initialMode || 'assembly');
    }, [initialMode]);

    useEffect(() => () => {
        abortWarmups();
    }, [abortWarmups]);

    useEffect(() => {
        const handlePageAction = (event) => {
            if (event.detail?.action !== 'practice-primary' || phase !== 'ready') {
                return;
            }

            workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        window.addEventListener('langflow:page-action', handlePageAction);
        return () => window.removeEventListener('langflow:page-action', handlePageAction);
    }, [phase]);

    const handleSave = ({ sentenceId, wordId, wordText, front, back, production }) => {
        const created = addFlashcard(sentenceId, wordId, front, back);
        if (created) {
            recordCardSaved({ wordId });
            setSaved((currentSaved) => [...currentSaved, { word: wordText, front, back, production }]);
            publishMilestone({
                kind: 'success',
                source: 'builder',
                title: 'Card salvo',
                description: `"${wordText}" entrou na fila de revisao.`,
            });
            return;
        }

        pushToast({
            kind: 'info',
            source: 'builder',
            title: 'Card ja existente',
            description: 'Essa frase ja foi salva anteriormente.',
        });
    };

    const secondaryAction = onDone ? <button className="btn btn-outline" onClick={onDone}>→ Ir para Flashcards</button> : null;

    useEffect(() => {
        const marker = autoAdjustMeta?.lastAdjustedAt
            ? `${autoAdjustMeta.lastAdjustedAt}:${autoAdjustMeta.toLevel || ''}`
            : null;

        if (!marker || autoAdjustMarkerRef.current === marker || !autoAdjustMeta?.toLevel) {
            return;
        }

        autoAdjustMarkerRef.current = marker;
        publishMilestone({
            kind: 'info',
            source: 'builder',
            title: 'Nivel ajustado automaticamente',
            description: `${autoAdjustMeta.fromLevel || config.userLevel} -> ${autoAdjustMeta.toLevel}`,
        });
    }, [autoAdjustMeta, config.userLevel, publishMilestone]);

    useEffect(() => {
        if (phase !== 'ready') return;
        if (practiceData.assemblyExercises.length > 0 && assemblyIndex >= practiceData.assemblyExercises.length && !completionFlagsRef.current.assembly) {
            completionFlagsRef.current.assembly = true;
            publishMilestone({
                kind: 'success',
                source: 'builder',
                title: 'Montagem concluida',
                description: `${practiceData.assemblyExercises.length} exercicios finalizados nesta sessao.`,
            });
        }
    }, [assemblyIndex, phase, practiceData.assemblyExercises.length, publishMilestone]);

    useEffect(() => {
        if (phase !== 'ready') return;
        if (practiceData.transformExercises.length > 0 && transformIndex >= practiceData.transformExercises.length && !completionFlagsRef.current.transform) {
            completionFlagsRef.current.transform = true;
            publishMilestone({
                kind: 'success',
                source: 'builder',
                title: 'Transform concluido',
                description: `${practiceData.transformExercises.length} exercicios de reescrita finalizados.`,
            });
        }
    }, [phase, practiceData.transformExercises.length, publishMilestone, transformIndex]);

    useEffect(() => {
        if (phase !== 'ready') return;
        if (practiceData.clozeExercises.length > 0 && clozeIndex >= practiceData.clozeExercises.length && !completionFlagsRef.current.cloze) {
            completionFlagsRef.current.cloze = true;
            publishMilestone({
                kind: 'success',
                source: 'builder',
                title: 'Cloze concluido',
                description: `${practiceData.clozeExercises.length} lacunas foram encerradas.`,
            });
        }
    }, [clozeIndex, phase, practiceData.clozeExercises.length, publishMilestone]);

    if (phase === 'loading') {
        return (
            <div className="text-neutral-800 antialiased min-h-screen flex flex-col pt-0 lg:pt-0 pb-16">
                <header className="px-4 md:px-8 h-20 w-full hidden md:flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-3">
                                <PuzzleIcon size={28} className="text-violet-600" />
                                Hub de Prática
                            </h1>
                            <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase mt-0.5">Preparando sua sessão...</p>
                        </div>
                    </div>
                </header>
                <main className="max-w-[1400px] w-full mt-2 lg:mt-4 mx-auto px-4 md:px-8">
                    <div className="bg-white rounded-3xl p-12 shadow-soft border border-neutral-100 flex flex-col items-center justify-center text-center mt-12">
                        <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center text-violet-600 mb-6 animate-pulse">
                            <PuzzleIcon size={36} />
                        </div>
                        <h3 className="text-2xl font-bold text-neutral-900 mb-3">Abrindo prática rápida</h3>
                        <p className="text-neutral-500 max-w-md">
                            Montando até {builderConfig.sessionWordLimit ?? 5} palavras com {(builderConfig.phrasesPerWord ?? 3)} variações por item.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    const allModesEmpty = practiceData.assemblyExercises.length === 0
        && practiceData.transformExercises.length === 0
        && practiceData.clozeExercises.length === 0
        && practiceData.promptTargets.length === 0;

    if (allModesEmpty) {
        return (
            <div className="text-neutral-800 antialiased min-h-screen flex flex-col pt-0 lg:pt-0 pb-16">
                <header className="px-4 md:px-8 h-20 w-full hidden md:flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-3">
                                <PuzzleIcon size={28} className="text-violet-600" />
                                Hub de Prática
                            </h1>
                            <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase mt-0.5">Sessão vazia</p>
                        </div>
                    </div>
                </header>
                <main className="max-w-[1400px] w-full mt-2 lg:mt-4 mx-auto px-4 md:px-8">
                    {error ? (
                        <div className="bg-red-50 text-red-700 border border-red-200 p-6 rounded-2xl mb-8 flex items-center gap-3 font-semibold">
                            ❌ {error}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl p-12 shadow-soft border border-neutral-100 flex flex-col items-center justify-center text-center mt-12 mb-8">
                            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-400 mb-6 border border-neutral-200 shadow-inner-soft">
                                <PuzzleIcon size={36} />
                            </div>
                            <h3 className="text-2xl font-bold text-neutral-900 mb-3">Nada para praticar agora</h3>
                            <p className="text-neutral-500 max-w-md">Clique em palavras no Reader, importe o seed do seu nível ou adicione itens ao banco para abrir uma sessão.</p>
                        </div>
                    )}
                    <div className="flex justify-center gap-4 flex-wrap">
                        <button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-8 py-3.5 rounded-full font-bold shadow-lg transition-transform hover:-translate-y-0.5 flex items-center gap-2" onClick={prepare}>
                            <ReloadIcon size={18} />
                            Atualizar sessão
                        </button>
                        {secondaryAction}
                    </div>
                </main>
            </div>
        );
    }

    const modeMeta = {
        assembly: {
            count: practiceData.assemblyExercises.length,
            index: assemblyIndex,
            title: 'Montagem',
        },
        transform: {
            count: practiceData.transformExercises.length,
            index: transformIndex,
            title: 'Transform',
        },
        cloze: {
            count: practiceData.clozeExercises.length,
            index: clozeIndex,
            title: 'Cloze',
        },
        prompt: {
            count: practiceData.promptTargets.length,
            index: 0,
            title: 'Prompt',
        },
    };

    const currentModeMeta = modeMeta[mode];
    const progress = currentModeMeta.count > 0 && mode !== 'prompt'
        ? Math.round(((currentModeMeta.index + 1) / currentModeMeta.count) * 100)
        : 0;

    const currentExercise = mode === 'assembly'
        ? practiceData.assemblyExercises[assemblyIndex]
        : mode === 'transform'
            ? practiceData.transformExercises[transformIndex]
            : mode === 'cloze'
                ? practiceData.clozeExercises[clozeIndex]
                : null;

    const currentContext = mode === 'assembly'
        ? currentExercise?.sentence?.portuguese || currentExercise?.sentence?.english
        : mode === 'transform'
            ? currentExercise?.sourceSentence
            : mode === 'cloze'
                ? currentExercise?.english
                : practiceData.promptTargets.map((target) => target.wordText).join(', ');

    const currentFocus = currentExercise?.wordText || practiceData.selectedWords.slice(0, 3).map((word) => word.wordText).join(', ');
    const completedCount = mode === 'prompt'
        ? Number(Boolean(useProgressStore.getState().dailyPromptHistory?.[new Date().toLocaleDateString('en-CA')]))
        : Math.min(currentModeMeta.index, currentModeMeta.count);
    const remainingCount = mode === 'prompt'
        ? Math.max(0, 1 - completedCount)
        : Math.max(currentModeMeta.count - currentModeMeta.index, 0);

    return (
        <div className="text-neutral-800 antialiased min-h-screen flex flex-col pt-0 lg:pt-0 pb-16">
            <header className="px-4 md:px-8 h-20 w-full hidden md:flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-3">
                            <PuzzleIcon size={28} className="text-violet-600" />
                            Hub de Prática
                        </h1>
                        <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase mt-0.5">Fixação dinâmica em múltiplos formatos</p>
                    </div>
                </div>
            </header>

            <main className="max-w-[1400px] w-full mt-2 lg:mt-4 mx-auto px-4 md:px-8 relative">
                <div className="bg-white rounded-[2rem] p-6 lg:p-10 shadow-soft border border-neutral-100 mb-8 relative overflow-hidden" ref={workspaceRef} data-testid="builder-workspace-header">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-70"></div>
                    
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 border border-violet-200 mb-4 w-max">
                                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
                                <span className="text-[10px] font-bold text-violet-700 uppercase tracking-widest">Workspace da sessão</span>
                            </div>
                            <h3 className="text-3xl font-extrabold text-neutral-900 mb-2">{currentModeMeta.title}</h3>
                            <p className="text-sm text-neutral-500 max-w-xl">
                                {currentContext || 'A sessão atual usa o vocabulário capturado no reader e no banco ativo.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                            <span className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[11px] font-bold uppercase tracking-wider">Concluídos {completedCount}</span>
                            <span className="px-3 py-1.5 bg-neutral-100 text-neutral-600 border border-neutral-200 rounded-lg text-[11px] font-bold uppercase tracking-wider">Restantes {remainingCount}</span>
                            <span className="px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg text-[11px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5"><SparkIcon size={12}/> Cards salvos {saved.length}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-neutral-100 relative z-10">
                        <div className="bg-neutral-50/80 p-4 rounded-2xl border border-neutral-100">
                            <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Foco atual</span>
                            <strong className="text-sm text-neutral-900 line-clamp-2">{currentFocus || 'Sessão sem foco definido'}</strong>
                        </div>
                        <div className="bg-neutral-50/80 p-4 rounded-2xl border border-neutral-100">
                            <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Itens na sessão</span>
                            <strong className="text-2xl font-black text-neutral-900">{practiceData.selectedWords.length}</strong>
                        </div>
                        <div className="bg-neutral-50/80 p-4 rounded-2xl border border-neutral-100">
                            <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Modo ativo</span>
                            <strong className="text-lg font-bold text-violet-600">{currentModeMeta.title}</strong>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8 bg-neutral-100/50 p-1.5 rounded-2xl w-max">
                    {PRACTICE_MODES.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                mode === item.id 
                                ? 'bg-white text-violet-700 shadow-sm border border-neutral-200/60' 
                                : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/50'
                            }`}
                            onClick={() => setMode(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {mode !== 'prompt' && currentModeMeta.count > 0 && (
                    <div className="mb-8 pl-1">
                        <div className="flex items-center justify-between mb-3 text-sm font-bold">
                            <span className="text-neutral-500">{currentModeMeta.title} <span className="text-neutral-300 mx-1">•</span> exercício {Math.min(currentModeMeta.index + 1, currentModeMeta.count)} de {currentModeMeta.count}</span>
                            <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-violet-200">{practiceData.selectedWords.length} itens na sessão</span>
                        </div>
                        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/50">
                            <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-500 relative" style={{ width: `${progress}%` }}>
                                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'assembly' && (
                    practiceData.assemblyExercises.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🧩</div>
                            <h3>Nenhuma montagem disponível</h3>
                            <p>Importe seed ou clique em palavras no Reader para montar novas frases.</p>
                        </div>
                    ) : assemblyIndex >= practiceData.assemblyExercises.length ? (
                        <div className="page-content builder-page builder-summary-page">
                            <div className="builder-summary-hero">
                                <div className="builder-summary-icon"><SparkIcon size={28} /></div>
                                <h2 className="builder-summary-title">Montagem concluída</h2>
                                <p className="builder-summary-copy">
                                    Você completou {practiceData.assemblyExercises.length} exercícios · {saved.length} frases salvas no flashcard
                                </p>
                            </div>

                            {saved.length > 0 && (
                                <div className="card mb-lg">
                                    <div className="section-label mb-sm">Frases salvas</div>
                                    {saved.map((item, index) => (
                                        <div key={`${item.back}_${index}`} className="builder-saved-row">
                                            <div className="builder-saved-front">{item.front}</div>
                                            <div className="builder-saved-back">{item.back}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-md flex-wrap">
                                <button className="btn btn-primary" onClick={() => { setAssemblyIndex(0); setSaved([]); }}>
                                    <span className="btn-icon"><ReloadIcon size={15} /></span>
                                    <span>Refazer montagem</span>
                                </button>
                                {secondaryAction}
                            </div>
                        </div>
                    ) : (
                        <SentenceExercise
                            key={practiceData.assemblyExercises[assemblyIndex].sentence.id}
                            exercise={practiceData.assemblyExercises[assemblyIndex]}
                            onComplete={() => setAssemblyIndex((value) => value + 1)}
                            onSave={handleSave}
                        />
                    )
                )}

                {mode === 'transform' && (
                    practiceData.transformExercises.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🔁</div>
                            <h3>Nenhuma transformação disponível</h3>
                            <p>As frases desta sessão ainda não geraram pares suficientes para transformação.</p>
                        </div>
                    ) : transformIndex >= practiceData.transformExercises.length ? (
                        renderModeSummary({
                            title: 'Transform concluído',
                            copy: `Você completou ${practiceData.transformExercises.length} exercícios de reescrita.`,
                            actionLabel: 'Refazer Transform',
                            onReset: () => setTransformIndex(0),
                            secondaryAction,
                        })
                    ) : (
                        <TransformExercise
                            key={practiceData.transformExercises[transformIndex].id}
                            exercise={practiceData.transformExercises[transformIndex]}
                            onComplete={() => setTransformIndex((value) => value + 1)}
                        />
                    )
                )}

                {mode === 'cloze' && (
                    practiceData.clozeExercises.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🕳️</div>
                            <h3>Nenhum cloze disponível</h3>
                            <p>Adicione mais itens ao banco para abrir lacunas contextualizadas.</p>
                        </div>
                    ) : clozeIndex >= practiceData.clozeExercises.length ? (
                        renderModeSummary({
                            title: 'Cloze concluído',
                            copy: `Você completou ${practiceData.clozeExercises.length} exercícios de lacuna.`,
                            actionLabel: 'Refazer Cloze',
                            onReset: () => setClozeIndex(0),
                            secondaryAction,
                        })
                    ) : (
                        <ClozeExercise
                            key={practiceData.clozeExercises[clozeIndex].id}
                            exercise={practiceData.clozeExercises[clozeIndex]}
                            onComplete={() => setClozeIndex((value) => value + 1)}
                        />
                    )
                )}

                {mode === 'prompt' && (
                    <DailyPromptPanel
                        key={`${config.userLevel}_${practiceData.promptTargets.map((target) => target.wordId).join('_')}`}
                        targets={practiceData.promptTargets}
                    />
                )}
            </main>
        </div>
    );
}
