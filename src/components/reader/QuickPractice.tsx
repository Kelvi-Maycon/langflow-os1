import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react'
import { useStore } from '@/store/main'
import { cn } from '@/lib/utils'

interface QuickPracticeProps {
  words: { word: string; translation: string; sentence: string }[]
  onComplete: () => void
}

const practiceMocks: Record<string, { pt: string; en: string }> = {
  the: { pt: 'O carro é azul.', en: 'The car is blue.' },
  is: { pt: 'Ele é alto.', en: 'He is tall.' },
  quick: { pt: 'A raposa rápida corre.', en: 'The quick fox runs.' },
  brown: { pt: 'A raposa é marrom.', en: 'The fox is brown.' },
  fox: { pt: 'A raposa pulou.', en: 'The fox jumped.' },
  jumps: { pt: 'O gato pula alto.', en: 'The cat jumps high.' },
  over: { pt: 'O avião voa sobre a cidade.', en: 'The plane flies over the city.' },
  lazy: { pt: 'O cachorro preguiçoso dorme.', en: 'The lazy dog sleeps.' },
  dog: { pt: 'O cachorro late.', en: 'The dog barks.' },
  serendipity: { pt: 'Foi um momento de serendipidade.', en: 'It was a moment of serendipity.' },
  ephemeral: { pt: 'A beleza é efêmera.', en: 'Beauty is ephemeral.' },
  ubiquitous: { pt: 'A tecnologia é onipresente hoje.', en: 'Technology is ubiquitous today.' },
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
              en: `I saw a ${currentItem.word} today.`,
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
                  'Você é um professor de inglês. Usando a frase de contexto original como base, crie uma frase simples em inglês (máx 8 palavras) focada na palavra alvo. A frase deve ser idêntica ou muito parecida com o contexto, mas simplificada se necessário. Forneça também a tradução natural e exata em português. Retorne apenas JSON: {"pt": "frase em português", "en": "frase em inglês"}',
              },
              {
                role: 'user',
                content: `Palavra alvo: "${currentItem.word}"\nTradução: "${currentItem.translation}"\nContexto original: "${currentItem.sentence}"`,
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
            en: `I saw a ${currentItem.word} today.`,
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
    <div className="space-y-6 animate-fade-in flex flex-col w-full mx-auto py-2">
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <ArrowRight className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-xl text-primary tracking-tight">Prática Rápida</h3>
        </div>
        <div className="text-sm font-semibold text-muted-foreground bg-secondary/80 px-3 py-1 rounded-full">
          {currentIndex + 1} / {words.length}
        </div>
      </div>

      {isLoading || !practiceData ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">
            Gerando exercício de tradução ideal...
          </p>
        </div>
      ) : (
        <>
          <div className="p-6 md:p-8 rounded-2xl border border-border bg-card shadow-sm space-y-3">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
              Traduza para o inglês
            </p>
            <p className="text-2xl md:text-3xl font-medium text-foreground leading-tight">
              {practiceData.pt}
            </p>
          </div>

          <div className="space-y-4">
            <Input
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value)
                if (status !== 'idle') setStatus('idle')
              }}
              placeholder="Digite a tradução exata em inglês..."
              className={cn(
                'h-14 text-lg px-4 transition-all duration-300 rounded-xl',
                status === 'incorrect'
                  ? 'border-destructive focus-visible:ring-destructive focus-visible:border-destructive text-foreground bg-background'
                  : status === 'correct'
                    ? 'border-green-500 focus-visible:ring-green-500 focus-visible:border-green-500 bg-background'
                    : 'bg-background',
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (status === 'correct') handleNext()
                  else if (answer.trim()) checkAnswer()
                }
              }}
              autoFocus
            />

            {status === 'incorrect' && (
              <div className="text-destructive flex items-start gap-3 bg-destructive/5 border border-destructive/20 p-4 rounded-xl animate-fade-in">
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-base">Tradução incorreta</p>
                  <p className="text-sm opacity-90">
                    A frase exata esperada era:{' '}
                    <strong className="font-semibold">"{practiceData.en}"</strong>
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    Verifique a estrutura e tente novamente.
                  </p>
                </div>
              </div>
            )}

            {status === 'correct' && (
              <div className="text-green-600 flex items-center gap-3 bg-green-50 border border-green-200 p-4 rounded-xl animate-fade-in dark:bg-green-950/30 dark:border-green-900 dark:text-green-400">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <span className="font-medium text-base">
                  Excelente! Tradução validada com sucesso.
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 mt-auto">
            {status === 'correct' ? (
              <Button
                onClick={handleNext}
                size="lg"
                className="w-full h-14 text-base rounded-xl group"
              >
                {currentIndex < words.length - 1 ? 'Próxima Palavra' : 'Concluir Sessão'}{' '}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button
                onClick={checkAnswer}
                size="lg"
                className="w-full h-14 text-base rounded-xl"
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
