export const WORD_STATUSES = ['desconhecida', 'reconhecida', 'em_treino', 'ativa', 'dominada'];

export const WORD_STATUS_META = {
    desconhecida: { label: 'Desconhecida', badgeClass: 'badge-unknown', color: 'var(--c-muted)' },
    reconhecida: { label: 'Reconhecida', badgeClass: 'badge-recognized', color: '#60A5FA' },
    em_treino: { label: 'Em Treino', badgeClass: 'badge-training', color: 'var(--c-brand-light)' },
    ativa: { label: 'Ativa', badgeClass: 'badge-active', color: '#FBBF24' },
    dominada: { label: 'Dominada', badgeClass: 'badge-mastered', color: 'var(--c-success)' },
};

export const DEFAULT_MISSIONS = {
    readerWords: 5,
    builderExercises: 6,
    flashcardReviews: 10,
    productionWrites: 2,
    recycledWords: 3,
};

export const MISSION_META = [
    { key: 'readerWords', label: 'Leitura Matinal', icon: '📖', desc: 'Clique em novas palavras durante a leitura.', xp: 25 },
    { key: 'builderExercises', label: 'Prática Guiada', icon: '🧩', desc: 'Complete construções de frase com foco na forma correta.', xp: 60 },
    { key: 'flashcardReviews', label: 'Revisão SRS Diária', icon: '🧠', desc: 'Revisite cards devidos para manter retenção alta.', xp: 80 },
    { key: 'productionWrites', label: 'Produção Livre', icon: '✍️', desc: 'Escreva frases próprias usando o vocabulário do dia.', xp: 30 },
    { key: 'recycledWords', label: 'Reciclagem Ativa', icon: '♻️', desc: 'Reative palavras já vistas para consolidar o ciclo.', xp: 35 },
];

export const ACHIEVEMENT_META = {
    first_discovery: { icon: '🌱', title: 'Primeira descoberta', desc: 'Você adicionou sua primeira palavra ao ciclo.' },
    builder_apprentice: { icon: '🧩', title: 'Arquiteto de frases', desc: 'Completou 25 exercícios no construtor.' },
    memory_keeper: { icon: '🗂️', title: 'Guardião do banco', desc: 'Salvou 20 frases em flashcards.' },
    recycler: { icon: '♻️', title: 'Reciclador', desc: 'Reativou 15 palavras antigas.' },
    perfect_flow: { icon: '✨', title: 'Fluxo perfeito', desc: 'Acertou 10 exercícios de primeira.' },
    weekly_rhythm: { icon: '📅', title: 'Ritmo semanal', desc: 'Estudou em pelo menos 4 dias na semana.' },
    active_lexicon: { icon: '🔥', title: 'Vocabulário ativo', desc: 'Levou 10 itens até o estágio ativo.' },
    prompt_starter: { icon: '📝', title: 'Prompt do dia', desc: 'Concluiu seu primeiro desafio diário de produção.' },
};

export const XP_PER_LEVEL = 120;
