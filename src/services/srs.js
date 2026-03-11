// services/srs.js — Algoritmo SM-2 Simplificado (como o Anki)

export const WORD_STATUS_ORDER = ['desconhecida', 'reconhecida', 'em_treino', 'ativa', 'dominada'];

/**
 * Calcula próximo intervalo para um flashcard
 * @param {object} card - {easeFactor, interval, lapseCount}
 * @param {'nao_lembro'|'dificil'|'bom'|'facil'} rating
 * @returns {object} - {interval, easeFactor, lapseCount, nextReview}
 */
export function calculateSRS(card, rating) {
    let { easeFactor = 2.5, interval = 1, lapseCount = 0 } = card;

    switch (rating) {
        case 'nao_lembro':
            interval = 1;
            easeFactor = Math.max(1.3, easeFactor - 0.2);
            lapseCount += 1;
            break;
        case 'dificil':
            interval = Math.ceil(interval * 1.2);
            easeFactor = Math.max(1.3, easeFactor - 0.15);
            break;
        case 'bom':
            interval = Math.ceil(interval * easeFactor);
            break;
        case 'facil':
            interval = Math.ceil(interval * easeFactor * 1.3);
            easeFactor += 0.15;
            break;
        default:
            break;
    }

    // Mínimo de 1 dia
    interval = Math.max(1, interval);

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);
    nextReview.setHours(0, 0, 0, 0);

    return {
        easeFactor,
        interval,
        lapseCount,
        nextReview: nextReview.getTime(),
        lastReviewResult: rating,
    };
}

export function demoteWordStatus(status, steps = 1) {
    const index = WORD_STATUS_ORDER.indexOf(status);
    if (index === -1) return 'desconhecida';
    return WORD_STATUS_ORDER[Math.max(0, index - steps)];
}

function applyStudyMilestones(word, status) {
    const correctCount = word.correctCount ?? word.dragCorrectCount ?? 0;
    const reviewCount = word.reviewCount ?? 0;
    const recentLapses = word.recentLapses ?? 0;
    const easeFactor = word.easeFactor ?? 2.5;

    if (status === 'em_treino' && correctCount >= 2 && reviewCount >= 2 && recentLapses <= 1 && easeFactor >= 2) {
        return 'ativa';
    }

    if (status === 'ativa' && correctCount >= 4 && reviewCount >= 5 && recentLapses === 0 && easeFactor >= 2.3) {
        return 'dominada';
    }

    return status;
}

export function getStatusAfterReader(word) {
    return word.status === 'desconhecida' ? 'reconhecida' : word.status;
}

export function getStatusAfterBuilder(word, { correct = false } = {}) {
    let status = word.status || 'desconhecida';

    if (status === 'desconhecida' || status === 'reconhecida') {
        status = 'em_treino';
    }

    if (!correct && (word.builderErrorStreak || 0) >= 3) {
        return demoteWordStatus(status, 1);
    }

    return applyStudyMilestones(word, status);
}

export function getStatusAfterReview(word, rating) {
    let status = word.status || 'desconhecida';

    if (rating === 'nao_lembro') {
        return demoteWordStatus(status, 1);
    }

    return applyStudyMilestones(word, status);
}

/**
 * Calcula o intervalo previsto para exibição no botão SRS
 */
export function previewInterval(card, rating) {
    const { easeFactor = 2.5, interval = 1 } = card;
    switch (rating) {
        case 'nao_lembro': return 1;
        case 'dificil': return Math.ceil(interval * 1.2);
        case 'bom': return Math.ceil(interval * easeFactor);
        case 'facil': return Math.ceil(interval * easeFactor * 1.3);
        default: return interval;
    }
}

/**
 * Checa se um card está disponível para revisão hoje
 */
export function isDueToday(card) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !card.nextReview || card.nextReview <= today.getTime();
}

export function sortDueCards(cards) {
    const now = Date.now();

    return [...cards].sort((a, b) => {
        const overdueA = Math.max(0, now - (a.nextReview || 0));
        const overdueB = Math.max(0, now - (b.nextReview || 0));

        if (overdueB !== overdueA) {
            return overdueB - overdueA;
        }

        const easeA = a.easeFactor ?? 2.5;
        const easeB = b.easeFactor ?? 2.5;
        if (easeA !== easeB) {
            return easeA - easeB;
        }

        return (a.createdAt || 0) - (b.createdAt || 0);
    });
}

/**
 * Checa promoção de status de palavra
 */
export function checkWordPromotion(word, recentLapses = 0) {
    return getStatusAfterReview({ ...word, recentLapses }, word.lastReviewResult);
}

export function formatInterval(days) {
    if (days === 1) return '1d';
    if (days < 7) return `${days}d`;
    if (days < 30) return `${Math.round(days / 7)}sem`;
    return `${Math.round(days / 30)}mes`;
}
