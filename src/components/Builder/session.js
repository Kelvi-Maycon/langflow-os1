import { buildLocalSentenceSet } from '../../services/ai.js';

const STATUS_RANK = {
    ativa: 0,
    em_treino: 1,
    reconhecida: 2,
    desconhecida: 3,
    dominada: 4,
};

const TYPE_ORDER = ['positive', 'negative', 'past', 'future'];

function sortBankWords(bankWords) {
    return [...bankWords]
        .filter(word => word.status !== 'dominada')
        .sort((a, b) => {
            const statusDiff = (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99);
            if (statusDiff !== 0) return statusDiff;
            return (a.lastPracticedAt || a.addedAt || 0) - (b.lastPracticedAt || b.addedAt || 0);
        });
}

function uniqueSessionWords(initialWords) {
    const seen = new Set();

    return initialWords.filter((word) => {
        if (!word?.wordId || seen.has(word.wordId)) return false;
        seen.add(word.wordId);
        return true;
    });
}

export function selectBuilderWords({
    initialWords = [],
    bankWords = [],
    builderConfig = {},
}) {
    const sessionWordLimit = Math.max(1, builderConfig.sessionWordLimit ?? 5);
    const difficultWordsWeight = Math.min(100, Math.max(0, builderConfig.difficultWordsWeight ?? 30));

    const readerWords = uniqueSessionWords(initialWords)
        .slice(0, sessionWordLimit)
        .map(word => ({
            wordId: word.wordId,
            wordText: word.wordText,
            originalSentence: word.originalSentence || '',
            recycled: false,
        }));

    const remainingSlots = Math.max(0, sessionWordLimit - readerWords.length);
    if (remainingSlots === 0) return readerWords;

    const selectedIds = new Set(readerWords.map(word => word.wordId));
    const sortedPool = sortBankWords(bankWords).filter(word => !selectedIds.has(word.id));
    const localPool = sortedPool.filter(word => !word.isSeeded);
    const seededPool = sortedPool.filter(word => word.isSeeded);
    const maxLocalWords = Math.min(
        remainingSlots,
        localPool.length,
        Math.max(readerWords.length > 0 ? 1 : 0, Math.round(sessionWordLimit * (difficultWordsWeight / 100)))
    );

    const localSelection = localPool
        .slice(0, maxLocalWords)
        .map(word => ({
            wordId: word.id,
            wordText: word.word,
            originalSentence: word.originalSentence || '',
            recycled: true,
        }));

    const seededSelection = seededPool
        .filter(word => !localSelection.some(selectedWord => selectedWord.wordId === word.id))
        .slice(0, Math.max(0, remainingSlots - localSelection.length))
        .map(word => ({
            wordId: word.id,
            wordText: word.word,
            originalSentence: word.originalSentence || '',
            recycled: true,
        }));

    return [...readerWords, ...localSelection, ...seededSelection];
}

export function buildSentenceVariants({ wordId, wordText, cachedSentences = [], phrasesPerWord = 3 }) {
    const phraseLimit = Math.max(1, Math.min(phrasesPerWord ?? 3, 3));
    const localFallback = buildLocalSentenceSet(wordText).sentences;
    const byType = new Map();

    [...cachedSentences, ...localFallback].forEach((sentence) => {
        if (!sentence?.english || !sentence?.portuguese) return;
        const type = TYPE_ORDER.includes(sentence.type) ? sentence.type : TYPE_ORDER[byType.size] || 'positive';
        if (!byType.has(type)) {
            byType.set(type, {
                ...sentence,
                id: sentence.id || `${wordId}_${type}`,
                wordId,
                wordText,
            });
        }
    });

    return TYPE_ORDER
        .filter(type => byType.has(type))
        .slice(0, phraseLimit)
        .map(type => byType.get(type));
}

export function buildBuilderExercises({ selectedWords, recentSentencesByWord, builderConfig = {} }) {
    return selectedWords.flatMap((selectedWord) => {
        const cachedSentences = recentSentencesByWord[selectedWord.wordId] || [];
        const sentences = buildSentenceVariants({
            wordId: selectedWord.wordId,
            wordText: selectedWord.wordText,
            cachedSentences,
            phrasesPerWord: builderConfig.phrasesPerWord ?? 3,
        });

        return sentences.map((sentence) => ({
            wordId: selectedWord.wordId,
            wordText: selectedWord.wordText,
            recycled: selectedWord.recycled,
            sentence,
        }));
    });
}
