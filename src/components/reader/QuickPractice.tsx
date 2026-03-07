import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react'
import { useStore } from '@/store/main'

interface QuickPracticeProps {
  words: { word: string; translation: string; sentence: string }[]
  onComplete: () => void
}

const practiceMocks: Record<string, { pt: string; en: string }> = {
  the: { pt: 'O carro é azul.', en: 'The car is blue' },
  is: { pt: 'Ele é alto.', en: 'He is tall' },
  quick: { pt: 'Ele é muito rápido.', en: 'He is very quick' },
  brown: { pt: 'O urso marrom.', en: 'The brown bear' },
  fox: { pt: 'A raposa esperta.', en: 'The smart fox' },
  jumps: { pt: 'O gato pula.', en: 'The cat jumps' },
  over: { pt: 'O avião voa sobre a cidade.', en: 'The plane flies over the city' },
  lazy: { pt: 'O cachorro preguiçoso.', en: 'The lazy dog' },
  dog: { pt: 'O cachorro late.', en: 'The dog barks' },
  serendipity: { pt: 'Foi uma descoberta feliz por acaso.', en: 'It was a serendipity' },
  ephemeral: { pt: 'A arte efêmera.', en: 'The ephemeral art' },
  ubiquitous: { pt: 'A tecnologia é onipresente.', en: 'Technology is ubiquitous' },
}

export function QuickPractice({ words, onComplete }: QuickPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle')
  const [practiceData, setPracticeData] = useState<{ pt: string; en: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { addWord, words: globalWords, settings } = useStore()
  const currentItem = words[currentIndex]
  const fetchedIndex = useRef(-1)

  useEffect(() => {
    if (!currentItem || fetchedIndex.current === currentIndex) return

    fetchedIndex.current = currentIndex
    setIsLoading(true)
    setAnswer('')
    setStatus('idle')

    const fetchPractice = async () => {
      if (!settings.apiKey) {
        setTimeout(() => {
          setPracticeData(
            practiceMocks[currentItem.word.toLowerCase()] || {
              pt: `Eu vi um(a) ${currentItem.translation} hoje.`,
              en: `I saw a ${currentItem.word} today`,
            },
          )
          setIsLoading(false)
        }, 500)
        return
      }

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.apiKey}`,
          },
          body: JSON.stringify({
            model: settings.aiModel || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'Você é um professor de inglês. Crie uma frase MUITO curta e simples em inglês (máx 6 palavras) focada na palavra fornecida, e forneça sua tradução exata e natural em português. Retorne apenas JSON: {"pt": "frase em português", "en": "frase em inglês"}',
              },
              {
                role: 'user',
                content: `Palavra alvo: "${currentItem.word}", Tradução: "${currentItem.translation}"`,
              },
            ],
            response_format: { type: 'json_object' },
          }),
        })
        const data = await response.json()
        if (data.error) throw new Error(data.error.message)
        const result = JSON.parse(data.choices[0].message.content)
        setPracticeData(result)
      } catch (err) {
        console.error(err)
        setPracticeData(
          practiceMocks[currentItem.word.toLowerCase()] || {
            pt: `Eu vi um(a) ${currentItem.translation} hoje.`,
            en: `I saw a ${currentItem.word} today`,
          },
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchPractice()
  }, [currentIndex, currentItem, settings.apiKey, settings.aiModel])

  if (!currentItem) return null

  const checkAnswer = () => {
    if (!practiceData) return
    const normalize = (str: string) =>
      str
        .trim()
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
    const cleanInput = normalize(answer)
    const cleanExpected = normalize(practiceData.en)

    if (cleanInput === cleanExpected) {
      setStatus('correct')
    } else {
      setStatus('incorrect')
    }
  }

  const handleNext = () => {
    if (status === 'correct') {
      const isAlreadySaved = globalWords.some(
        (w) => w.word.toLowerCase() === currentItem.word.toLowerCase(),
      )
      if (!isAlreadySaved) {
        addWord({
          word: currentItem.word,
          translation: currentItem.translation,
          contextSentence: currentItem.sentence,
          status: 'learning',
        })
      }
    }

    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      onComplete()
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up flex flex-col h-full w-full max-w-2xl mx-auto py-4">
      <div className="flex items-center justify-between text-primary border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <ArrowRight className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-2xl tracking-tight">Prática Rápida</h3>
        </div>
        <div className="text-sm font-bold text-muted-foreground bg-secondary px-4 py-1.5 rounded-full">
          {currentIndex + 1} / {words.length}
        </div>
      </div>

      {isLoading || !practiceData ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[250px] bg-secondary/10 rounded-[24px] border border-border">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">
            Gerando exercício de tradução ideal...
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 bg-secondary/20 p-8 rounded-[24px] border border-border shadow-sm">
            <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-2">
              Traduza para o inglês
            </p>
            <p className="text-3xl font-medium text-foreground leading-tight">{practiceData.pt}</p>
          </div>

          <div className="space-y-4 flex-1">
            <Input
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value)
                if (status !== 'idle') setStatus('idle')
              }}
              placeholder="Digite a tradução exata em inglês..."
              className={`h-16 text-xl px-6 transition-all duration-300 rounded-[20px] ${
                status === 'incorrect'
                  ? 'border-destructive focus-visible:ring-destructive focus-visible:border-destructive bg-destructive/5'
                  : status === 'correct'
                    ? 'border-success focus-visible:ring-success focus-visible:border-success bg-success/5'
                    : 'bg-background shadow-inner'
              }`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (status === 'correct') handleNext()
                  else if (answer.trim()) checkAnswer()
                }
              }}
              autoFocus
            />

            {status === 'incorrect' && (
              <div className="text-destructive flex items-start gap-3 bg-destructive/10 border border-destructive/20 p-5 rounded-2xl animate-fade-in">
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-base">Tradução incorreta</p>
                  <p className="opacity-90 text-sm">
                    A frase exata esperada era:{' '}
                    <strong className="font-bold">"{practiceData.en}"</strong>
                  </p>
                  <p className="opacity-80 text-xs mt-1">
                    Verifique a estrutura e tente novamente.
                  </p>
                </div>
              </div>
            )}

            {status === 'correct' && (
              <div className="text-success text-sm flex items-center gap-3 bg-success/10 border border-success/20 p-5 rounded-2xl animate-fade-in">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <span className="font-semibold text-base">
                  Excelente! Tradução validada com sucesso.
                </span>
              </div>
            )}
          </div>

          <div className="pt-6 mt-auto">
            {status === 'correct' ? (
              <Button
                onClick={handleNext}
                size="lg"
                className="w-full h-16 text-lg rounded-2xl shadow-md group"
              >
                {currentIndex < words.length - 1 ? 'Próxima Palavra' : 'Concluir Sessão'}{' '}
                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button
                onClick={checkAnswer}
                size="lg"
                className="w-full h-16 text-lg rounded-2xl shadow-sm"
                disabled={!answer.trim()}
              >
                Verificar Resposta
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
