export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']

const LEVEL_INDEX = Object.fromEntries(CEFR_LEVELS.map((level, index) => [level, index]))

export function normalizeLexiconText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function inferEntryType(text, fallback = 'word') {
  const normalized = normalizeLexiconText(text)
  if (!normalized) return fallback
  return normalized.includes(' ') ? 'collocation' : fallback
}

export function compareCefrLevels(left, right) {
  return (LEVEL_INDEX[left] ?? -1) - (LEVEL_INDEX[right] ?? -1)
}

export function isLevelAtOrBelow(level, ceiling) {
  if (!level || !ceiling) return false
  return compareCefrLevels(level, ceiling) <= 0
}

export function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function containsLexiconText(input, target) {
  const normalizedInput = normalizeLexiconText(input)
  const normalizedTarget = normalizeLexiconText(target)
  if (!normalizedInput || !normalizedTarget) return false
  if (normalizedTarget.includes(' ')) {
    return normalizedInput.includes(normalizedTarget)
  }
  return new RegExp(`\\b${escapeRegExp(normalizedTarget)}\\b`, 'i').test(normalizedInput)
}

export function maskTargetInSentence(sentence, target) {
  const rawSentence = String(sentence || '')
  const rawTarget = String(target || '').trim()
  if (!rawSentence || !rawTarget) {
    return rawSentence
  }

  const matcher = new RegExp(`\\b${escapeRegExp(rawTarget)}\\b`, 'i')
  if (matcher.test(rawSentence)) {
    return rawSentence.replace(matcher, '_____')
  }

  return rawSentence
}
