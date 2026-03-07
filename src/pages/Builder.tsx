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

  // Game state
  const [pool, setPool] = useState<{ id: string; text: string }[]>([])
  const [constructed, setConstructed] = useState<{ id: string; text: string }[]>([])
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  useEffect(() => {
    if (currentWord) {
      // Split sentence into words and shuffle
      const tokens = currentWord.contextSentence.split(/(\s+)/).filter((t) => t.trim() !== '')
      const wordsWithIds = tokens.map((t, i) => ({ id: `${i}-${t}`, text: t }))
      // Simple shuffle
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
      toast({
        title: 'Excelente!',
        description: 'Frase construída corretamente.',
        className: 'bg-success text-success-foreground border-success',
      })
    } else {
      setIsCorrect(false)
    }
  }

  const handleNext = () => {
    updateWordStatus(currentWord.id, 'srs')
    if (currentIndex >= builderWords.length - 1) {
      setCurrentIndex(0) // Will naturally show empty state if none left
    }
  }

  if (builderWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in space-y-4">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <Hammer className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Oficina Vazia</h2>
        <p className="text-muted-foreground max-w-md">
          Você não tem palavras na fila de construção. Vá para o Leitor e capture novas palavras!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto h-full flex flex-col">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Hammer className="w-8 h-8 text-orange-500" />
          Construtor
        </h1>
        <p className="text-muted-foreground mt-2">
          Reconstrua a frase original para transformar "{currentWord.word}" em vocabulário ativo.
        </p>
      </header>

      <div className="flex justify-between items-center text-sm font-medium">
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
          Alvo: <strong>{currentWord.word}</strong>
        </span>
        <span className="text-muted-foreground">
          {currentIndex + 1} de {builderWords.length}
        </span>
      </div>

      <Card
        className={cn(
          'p-6 shadow-soft flex-1 flex flex-col min-h-[400px] border-2 transition-colors duration-300',
          isCorrect === true
            ? 'border-success bg-success/5'
            : isCorrect === false
              ? 'border-destructive bg-destructive/5'
              : 'border-border',
        )}
      >
        <div className="text-sm text-muted-foreground mb-4 font-medium flex items-center justify-between">
          Tradução: {currentWord.translation}
        </div>

        {/* Drop Zone */}
        <div className="min-h-[120px] p-4 bg-background rounded-xl border-2 border-dashed border-border flex flex-wrap gap-2 content-start mb-8 transition-all shadow-inner">
          {constructed.length === 0 && (
            <span className="text-muted-foreground/50 m-auto mt-8">
              Toque nas palavras abaixo para montar a frase
            </span>
          )}
          {constructed.map((item) => (
            <button
              key={item.id}
              onClick={() => handleConstructedClick(item)}
              className="px-4 py-2 bg-card border shadow-sm rounded-lg hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all active:scale-95 text-lg font-medium"
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
                className="px-4 py-2 bg-white border-2 border-border shadow-[0_4px_0_hsl(var(--border))] rounded-xl hover:translate-y-[2px] hover:shadow-[0_2px_0_hsl(var(--border))] active:translate-y-[4px] active:shadow-none transition-all text-lg font-medium select-none"
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 pt-6 border-t flex flex-col gap-3">
          {isCorrect === true ? (
            <Button
              size="lg"
              className="w-full h-14 text-lg bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleNext}
            >
              Continuar <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full h-14 text-lg"
              onClick={checkAnswer}
              disabled={pool.length > 0}
            >
              {isCorrect === false ? (
                <>
                  <X className="w-5 h-5 mr-2" /> Tentar Novamente
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" /> Verificar
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
