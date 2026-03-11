// utils/parser.js — Parse texto em tokens de palavras
export function parseText(text) {
  const tokens = []
  const regex = /([A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*[.,!?;:]*)|(\s+|[^A-Za-z0-9\s]+)/g
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      tokens.push({
        type: 'word',
        raw: match[0],
        clean: match[0].replace(/[^A-Za-z0-9'-]/g, '').toLowerCase(),
      })
    } else {
      tokens.push({ type: 'space', raw: match[0] })
    }
  }

  return tokens
}

export function getSentenceForToken(tokens, idx) {
  let start = idx,
    end = idx
  while (start > 0 && !/[.!?]/.test(tokens[start - 1]?.raw || '')) start--
  while (end < tokens.length - 1 && !/[.!?]/.test(tokens[end]?.raw || '')) end++
  return tokens
    .slice(start, end + 1)
    .map((t) => t.raw)
    .join('')
}
