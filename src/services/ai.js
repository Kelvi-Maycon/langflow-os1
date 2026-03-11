// services/ai.js — Serviço unificado de IA
import { callOpenAI, callOpenAIStructured } from './openai.js'
import { callGemini } from './gemini.js'

// Dicionário estático de fallback (sem IA)
const STATIC_DICT = {
  relentless: 'Continuing without stopping or getting less intense.',
  abundant: 'Existing or available in large quantities.',
  diligent: "Having or showing care and conscientiousness in one's work.",
  persevere: 'To continue in a course of action even in the face of difficulty.',
  eloquent: 'Fluent or persuasive in speaking or writing.',
  ambiguous: 'Open to more than one interpretation; having a double meaning.',
  volatile: 'Liable to change rapidly and unpredictably.',
  pragmatic: 'Dealing with things sensibly and realistically.',
  inherent: 'Existing in something as a permanent, essential, or characteristic attribute.',
  substantial: 'Of considerable importance, size, or worth.',
}

function staticDefinition(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  return (
    STATIC_DICT[w] ||
    `"${word}" — definition not found in offline dictionary. Configure an AI API for contextual explanations.`
  )
}

/**
 * Chama a IA configurada pelo usuário
 */
async function callAI(config, systemPrompt, userPrompt, signal) {
  if (!config) throw new Error('No AI configured')

  if (config.provider === 'openai') {
    return callOpenAI({
      apiKey: config.openaiKey,
      model: config.openaiModel || 'gpt-4o-mini',
      systemPrompt,
      userPrompt,
      signal,
    })
  } else if (config.provider === 'gemini') {
    return callGemini({
      apiKey: config.geminiKey,
      model: config.geminiModel || 'gemini-2.0-flash',
      systemPrompt,
      userPrompt,
      signal,
    })
  }
  throw new Error('Unknown provider')
}

export function buildLocalSentenceSet(word) {
  const cleanWord = String(word || '').trim() || 'word'
  return {
    word: cleanWord,
    sentences: [
      {
        english: `I learned the word "${cleanWord}" today.`,
        portuguese: `Eu aprendi a palavra "${cleanWord}" hoje.`,
        type: 'positive',
      },
      {
        english: `I don't know how to use "${cleanWord}" yet.`,
        portuguese: `Eu não sei como usar "${cleanWord}" ainda.`,
        type: 'negative',
      },
      {
        english: `We studied the word "${cleanWord}" yesterday.`,
        portuguese: `Nós estudamos a palavra "${cleanWord}" ontem.`,
        type: 'past',
      },
    ],
  }
}

function extractJSONObject(raw) {
  const normalized = raw
    .replace(/```json?/gi, '')
    .replace(/```/g, '')
    .trim()
  const firstBrace = normalized.indexOf('{')
  const lastBrace = normalized.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('No JSON object found in AI response.')
  }

  return normalized.slice(firstBrace, lastBrace + 1)
}

function normalizeSentenceItem(sentence, index) {
  const english = String(sentence?.english || '').trim()
  const portuguese = String(sentence?.portuguese || '').trim()
  const type = ['positive', 'negative', 'past', 'future'].includes(sentence?.type)
    ? sentence.type
    : index === 1
      ? 'negative'
      : index === 2
        ? 'past'
        : 'positive'

  if (!english || !portuguese) {
    throw new Error('Incomplete sentence payload returned by AI.')
  }

  return { english, portuguese, type }
}

function parseSentencePayload(raw) {
  const parsed = JSON.parse(extractJSONObject(raw))
  if (
    !parsed ||
    typeof parsed.word !== 'string' ||
    !Array.isArray(parsed.sentences) ||
    parsed.sentences.length < 3
  ) {
    throw new Error('Invalid sentence payload returned by AI.')
  }

  return {
    word: String(parsed.word || '').trim(),
    sentences: parsed.sentences.slice(0, 3).map(normalizeSentenceItem),
  }
}

const SENTENCE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    word: { type: 'string' },
    sentences: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          english: { type: 'string' },
          portuguese: { type: 'string' },
          type: { type: 'string', enum: ['positive', 'negative', 'past', 'future'] },
        },
        required: ['english', 'portuguese', 'type'],
      },
    },
  },
  required: ['word', 'sentences'],
}

function buildSentencePrompts(word, originalSentence, userLevel) {
  const systemPrompt = `You generate sentence exercises for an English learning app.
Return only valid JSON.
No markdown.
No commentary.
Follow the exact schema.
Use natural English and natural Brazilian Portuguese.
Keep the output suitable for level ${userLevel || 'B1'}.`

  const userPrompt = `Target word: "${word}"
Original context: "${originalSentence || ''}"

Return exactly:
{
  "word": "${word}",
  "sentences": [
    { "english": "...", "portuguese": "...", "type": "positive" },
    { "english": "...", "portuguese": "...", "type": "negative" },
    { "english": "...", "portuguese": "...", "type": "past" }
  ]
}

Rules:
- Exactly 3 sentences.
- First item type must be "positive".
- Second item type must be "negative".
- Third item type must be "past".
- Every English sentence must use the target word naturally.
- Keep sentences short to medium length.
- Do not leave any field empty.`

  return { systemPrompt, userPrompt }
}

/**
 * Gera explicação contextual de uma palavra (Tooltip M2)
 */
export async function explainWord({ word, sentence, userLevel, config }) {
  if (!config?.provider) {
    return { text: staticDefinition(word), fromAI: false }
  }

  const systemPrompt = `You are an English vocabulary assistant. Explain words simply and in context.
The user's English level is ${userLevel || 'B1'}.
Always explain in English. Keep explanations under 3 sentences. Be concise and clear.`

  const userPrompt = `Word: "${word}"
Sentence: "${sentence}"
Explain what "${word}" means in this context.
Use simple English. Do not translate to Portuguese.`

  const text = await callAI(config, systemPrompt, userPrompt)
  return { text, fromAI: true }
}

/**
 * Gera frases para Drag & Drop (M3)
 * Retorna JSON: { word, sentences: [{english, portuguese, type}] }
 */
export async function generateSentences({ word, originalSentence, userLevel, config, signal }) {
  if (!config?.provider) {
    return buildLocalSentenceSet(word)
  }

  const { systemPrompt, userPrompt } = buildSentencePrompts(word, originalSentence, userLevel)

  if (config.provider === 'openai') {
    try {
      const parsed = await callOpenAIStructured({
        apiKey: config.openaiKey,
        model: config.openaiModel || 'gpt-5-mini',
        systemPrompt,
        userPrompt,
        schemaName: 'langflow_sentence_set',
        schema: SENTENCE_SCHEMA,
        signal,
      })

      return {
        word: String(parsed.word || word).trim() || word,
        sentences: parsed.sentences.map(normalizeSentenceItem),
      }
    } catch {
      const raw = await callOpenAI({
        apiKey: config.openaiKey,
        model: config.openaiModel || 'gpt-5-mini',
        systemPrompt,
        userPrompt,
        maxTokens: 800,
        signal,
      })

      const parsed = parseSentencePayload(raw)
      return {
        word: parsed.word || word,
        sentences: parsed.sentences,
      }
    }
  }

  const raw = await callAI(config, systemPrompt, userPrompt, signal)
  const parsed = parseSentencePayload(raw)

  return {
    word: parsed.word || word,
    sentences: parsed.sentences,
  }
}
