import { CEFR_LEVELS, compareCefrLevels } from '../utils/lexicon.js'

const LEVEL_BUCKETS = {
  A1: [
    'able',
    'about',
    'after',
    'again',
    'answer',
    'because',
    'before',
    'change',
    'family',
    'happy',
    'important',
    'learn',
  ],
  A2: [
    'across',
    'actually',
    'advice',
    'arrive',
    'careful',
    'decide',
    'difference',
    'environment',
    'improve',
    'instead',
    'message',
    'suddenly',
  ],
  B1: [
    'achieve',
    'attitude',
    'challenge',
    'despite',
    'effort',
    'goal',
    'ignore',
    'instead of',
    'manage',
    'progress',
    'rather',
    'solution',
  ],
  B2: [
    'accurate',
    'assume',
    'benefit from',
    'complex',
    'considerable',
    'consistently',
    'crucial',
    'emerge',
    'maintain',
    'shift',
    'significant',
    'trend',
  ],
  C1: [
    'compelling',
    'constrain',
    'derive from',
    'diminish',
    'feasible',
    'implicit',
    'nuance',
    'overlap',
    'retain',
    'rigorous',
    'subtle',
    'tradeoff',
  ],
}

export const NGSL_SEED = Object.freeze(
  Object.fromEntries(
    CEFR_LEVELS.map((level) => [
      level,
      LEVEL_BUCKETS[level].map((text) => ({
        text,
        cefrLevel: level,
        source: 'ngsl',
        entryType: text.includes(' ') ? 'collocation' : 'word',
        isSeeded: true,
      })),
    ]),
  ),
)

export function getSeedEntriesForLevel(level, { through = false } = {}) {
  if (!level) return []

  return CEFR_LEVELS.filter((candidate) =>
    through ? compareCefrLevels(candidate, level) <= 0 : candidate === level,
  ).flatMap((candidate) => NGSL_SEED[candidate] || [])
}
