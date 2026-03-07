import { useState, useEffect, useMemo } from 'react'
import { useStore } from '@/store/main'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Hammer, Check, ArrowRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function Builder() {
  const { words, updateWordStatus } = useStore()
  const { toast } = useToast()

  const builderWords = useMemo(() => words.filter((w) => w.status === 'builder'), [words])
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentWord = builderWords[currentIndex]

  const [pool, setPool] = useState<{ id: string; text: string }[]>([])
  const [constructed, setConstructed] = useState<{ id: string; text: string }[]>([])
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  useEffect(() => {
    if (currentWord) {
      const tokens = currentWord.contextSentence.split(/(\s+)/).filter((t) => t.trim() !== '')
      const wordsWithIds = tokens.map((t, i) => ({ id: `${i}-${t}`, text: t }))
      const shuffled = [...wordsWithIds].sort(() => Math.random() - 0.5)
      setPool(shuffled)
      setConstructed([])
      setIsCorrect(null)
    }
  }, [currentWord])

  const handlePoolClick = (item: { id: string; text: string }) => {
    setPool((prev) => prev.filter((i) => i.id !== item.id))
    setConstructed((prev) => [...prev, item])
    setIsCorrect(null)
  }

  const handleConstructedClick = (item: { id: string; text: string }) => {
    setConstructed((prev) => prev.filter((i) => i.id !== item.id))
    setPool((prev) => [...prev, item])
    setIsCorrect(null)
  }

  const checkAnswer = () => {
    const answer = constructed.map((i) => i.text).join(' ')
    const originalTokens = currentWord.contextSentence
      .split(/(\s+)/)
      .filter((t) => t.trim() !== '')
      .join(' ')

    if (answer === originalTokens) {
      setIsCorrect(true)
    } else {
      setIsCorrect(false)
    }
  }

  const handleNext = () => {
    updateWordStatus(currentWord.id, 'srs')
    if (currentIndex >= builderWords.length - 1) {
      setCurrentIndex(0)
    }
  }

  if (builderWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in space-y-4">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-4 border border-white/5">
          <Hammer className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold">Oficina Vazia</h2>
        <p className="text-muted-foreground max-w-md text-lg">
          Você não tem palavras na fila de construção. Vá para o Leitor e capture novas palavras!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto h-full flex flex-col">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Hammer className="w-8 h-8 text-warning" />
            Construtor
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Reconstrua a frase para interiorizar a estrutura.
          </p>
        </div>
        <div className="text-sm font-medium bg-secondary px-4 py-2 rounded-full border border-white/5">
          {currentIndex + 1} de {builderWords.length}
        </div>
      </header>

      <Card
        className={cn(
          'p-8 flex-1 flex flex-col min-h-[400px] border-2 transition-all duration-500',
          isCorrect === true
            ? 'border-success bg-success/5 shadow-[0_0_30px_rgba(22,163,74,0.1)]'
            : isCorrect === false
              ? 'border-destructive bg-destructive/5 shadow-[0_0_30px_rgba(220,38,38,0.1)]'
              : 'border-white/5 bg-card/80 backdrop-blur-sm',
        )}
      >
        <div className="flex items-center justify-between mb-8">
          <span className="bg-primary/20 text-primary px-4 py-1.5 rounded-full font-bold text-lg border border-primary/20">
            Alvo: {currentWord.word}
          </span>
          <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full">
            <span className="text-primary">Tradução:</span> {currentWord.translation}
          </div>
        </div>

        {/* Drop Zone */}
        <div
          className={cn(
            'min-h-[160px] p-6 bg-background/40 rounded-3xl border-2 border-dashed flex flex-wrap gap-3 content-start mb-8 transition-all duration-300 shadow-inner',
            isCorrect === true
              ? 'border-success/50 bg-success/5'
              : isCorrect === false
                ? 'border-destructive/50 bg-destructive/5'
                : 'border-white/10',
          )}
        >
          {constructed.length === 0 && (
            <span className="text-muted-foreground/40 m-auto font-medium text-lg">
              Toque nas peças abaixo para montar a frase
            </span>
          )}
          {constructed.map((item) => (
            <button
              key={item.id}
              onClick={() => handleConstructedClick(item)}
              className={cn(
                'px-5 py-2.5 rounded-2xl transition-all active:scale-95 text-lg font-medium shadow-sm',
                isCorrect === true
                  ? 'bg-success/20 border-2 border-success text-success-foreground'
                  : isCorrect === false
                    ? 'bg-destructive/20 border-2 border-destructive text-destructive-foreground'
                    : 'bg-card border-2 border-primary/30 text-foreground hover:bg-destructive/20 hover:border-destructive hover:text-destructive-foreground',
              )}
            >
              {item.text}
            </button>
          ))}
        </div>

        {/* Word Pool */}
        <div className="flex-1">
          <div className="flex flex-wrap gap-3 justify-center">
            {pool.map((item) => (
              <button
                key={item.id}
                onClick={() => handlePoolClick(item)}
                className="px-5 py-2.5 bg-secondary border border-white/10 shadow-lg rounded-2xl hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_8px_20px_rgba(108,63,197,0.2)] active:translate-y-0 active:shadow-none transition-all text-lg font-medium text-foreground select-none"
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-3">
          {isCorrect === true ? (
            <Button
              size="lg"
              className="w-full h-16 text-lg bg-success hover:bg-success/90 text-success-foreground shadow-[0_0_20px_rgba(22,163,74,0.3)] animate-fade-in"
              onClick={handleNext}
            >
              Continuar <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              size="lg"
              className={cn(
                'w-full h-16 text-lg transition-all',
                isCorrect === false &&
                  'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-[0_0_20px_rgba(220,38,38,0.3)]',
              )}
              onClick={checkAnswer}
              disabled={pool.length > 0}
              variant={isCorrect === false ? 'destructive' : 'default'}
            >
              {isCorrect === false ? (
                <>
                  <X className="w-5 h-5 mr-2" /> Tentar Novamente
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" /> Verificar Resposta
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
