import { buildSentenceVariants } from './session.js'
import { compareCefrLevels, maskTargetInSentence } from '../../utils/lexicon.js'

function buildSentenceLookup(wordId, wordText, cachedSentences, builderConfig) {
  const variants = buildSentenceVariants({
    wordId,
    wordText,
    cachedSentences,
    phrasesPerWord: builderConfig.phrasesPerWord ?? 3,
  })

  return Object.fromEntries(variants.map((sentence) => [sentence.type, sentence]))
}

export function buildTransformExercises({
  selectedWords,
  recentSentencesByWord,
  builderConfig = {},
}) {
  return selectedWords.flatMap((selectedWord) => {
    const sentenceByType = buildSentenceLookup(
      selectedWord.wordId,
      selectedWord.wordText,
      recentSentencesByWord[selectedWord.wordId] || [],
      builderConfig,
    )

    const pairs = [
      ['positive', 'negative', 'Passe para a forma negativa'],
      ['positive', 'past', 'Passe para o passado'],
      ['negative', 'positive', 'Transforme para a forma afirmativa'],
    ]

    return pairs
      .filter(([fromType, toType]) => sentenceByType[fromType] && sentenceByType[toType])
      .map(([fromType, toType, instruction]) => ({
        id: `${selectedWord.wordId}_${fromType}_${toType}`,
        wordId: selectedWord.wordId,
        wordText: selectedWord.wordText,
        recycled: selectedWord.recycled,
        instruction,
        sourceSentence: sentenceByType[fromType].english,
        sourcePortuguese: sentenceByType[fromType].portuguese,
        expectedSentence: sentenceByType[toType].english,
        expectedPortuguese: sentenceByType[toType].portuguese,
      }))
  })
}

export function buildClozeExercises({ selectedWords, recentSentencesByWord, builderConfig = {} }) {
  return selectedWords.flatMap((selectedWord) => {
    const variants = buildSentenceVariants({
      wordId: selectedWord.wordId,
      wordText: selectedWord.wordText,
      cachedSentences: recentSentencesByWord[selectedWord.wordId] || [],
      phrasesPerWord: builderConfig.phrasesPerWord ?? 3,
    })

    return variants.map((sentence) => ({
      id: `${selectedWord.wordId}_cloze_${sentence.type}`,
      wordId: selectedWord.wordId,
      wordText: selectedWord.wordText,
      recycled: selectedWord.recycled,
      type: sentence.type,
      english: sentence.english,
      portuguese: sentence.portuguese,
      maskedEnglish: maskTargetInSentence(sentence.english, selectedWord.wordText),
      expectedText: selectedWord.wordText,
    }))
  })
}

function uniqueWords(words) {
  const seen = new Set()
  return words.filter((word) => {
    if (!word?.id || seen.has(word.id)) return false
    seen.add(word.id)
    return true
  })
}

export function selectDailyPromptTargets({ words = [], userLevel, limit = 3 }) {
  const active = uniqueWords(words.filter((word) => word.status === 'ativa'))
  const training = uniqueWords(
    words.filter((word) => ['reconhecida', 'em_treino'].includes(word.status) && !word.isSeeded),
  )
  const seeded = uniqueWords(
    words.filter(
      (word) =>
        word.isSeeded && (!word.cefrLevel || compareCefrLevels(word.cefrLevel, userLevel) <= 0),
    ),
  )
  const fallback = uniqueWords(
    words.filter((word) => !word.isSeeded && word.status === 'desconhecida'),
  )

  return [...active, ...training, ...seeded, ...fallback].slice(0, limit).map((word) => ({
    wordId: word.id,
    wordText: word.word,
    entryType: word.entryType,
    status: word.status,
  }))
}
