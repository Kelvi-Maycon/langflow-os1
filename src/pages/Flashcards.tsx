import { useState, useMemo } from 'react'
import { useStore } from '@/store/main'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BrainCircuit, Check, X, Frown, Smile, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Flashcards() {
  const { words, reviewWord } = useStore()

  // Filter cards due for review
  const dueCards = useMemo(
    () =>
      words
        .filter((w) => w.status === 'srs' && w.nextReviewDate <= Date.now())
        .sort((a, b) => a.nextReviewDate - b.nextReviewDate),
    [words],
  )

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const currentCard = dueCards[currentIndex]

  const handleReview = (quality: number) => {
    if (!currentCard) return
    reviewWord(currentCard.id, quality)
    setIsFlipped(false)
    // We don't increment index because the array length shrinks due to useMemo recalculation
    // But actually, useMemo updates on render, so index 0 will be the next card automatically.
    // Let's reset to 0 just in case.
    setCurrentIndex(0)
  }

  if (dueCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in space-y-4">
        <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mb-4">
          <PartyPopper className="w-12 h-12 text-success" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">Tudo Feito!</h2>
        <p className="text-muted-foreground max-w-md text-lg">
          Você não tem revisões pendentes para hoje. Excelente trabalho mantendo seu vocabulário
          afiado.
        </p>
      </div>
    )
  }

  // Highlight the target word in the sentence
  const renderSentence = () => {
    if (!currentCard) return null
    const parts = currentCard.contextSentence.split(new RegExp(`(${currentCard.word})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === currentCard.word.toLowerCase() ? (
        <span key={i} className="bg-primary/20 text-primary font-bold px-1 rounded">
          {part}
        </span>
      ) : (
        part
      ),
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto h-full flex flex-col">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-primary" />
            Revisão
          </h1>
          <p className="text-muted-foreground mt-2">Pense na tradução e no contexto.</p>
        </div>
        <div className="bg-muted px-4 py-2 rounded-full text-sm font-medium border shadow-sm">
          {dueCards.length} restantes
        </div>
      </header>

      {/* Perspective wrapper for 3D flip effect */}
      <div className="flex-1 perspective-1000 relative min-h-[400px]">
        <div
          className={cn(
            'w-full h-full absolute top-0 left-0 transition-all duration-500 preserve-3d cursor-pointer',
            isFlipped ? 'rotate-y-180' : '',
          )}
          onClick={() => !isFlipped && setIsFlipped(true)}
        >
          {/* Front of card */}
          <Card
            className={cn(
              'w-full h-full absolute top-0 left-0 backface-hidden p-8 flex flex-col items-center justify-center shadow-hover border-2 text-center bg-white',
              isFlipped ? 'pointer-events-none opacity-0' : '',
            )}
          >
            <span className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-8">
              Tradução
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground capitalize leading-tight">
              {currentCard.translation}
            </h2>
            <p className="mt-12 text-muted-foreground animate-pulse">Toque para revelar</p>
          </Card>

          {/* Back of card */}
          <Card
            className={cn(
              'w-full h-full absolute top-0 left-0 backface-hidden rotate-y-180 p-8 flex flex-col justify-between shadow-hover border-2 border-primary/20 bg-white',
              !isFlipped ? 'pointer-events-none opacity-0' : '',
            )}
          >
            <div className="text-center flex-1 flex flex-col justify-center">
              <span className="text-sm font-semibold tracking-wider uppercase text-primary mb-4">
                Inglês
              </span>
              <h2 className="text-4xl font-bold text-foreground mb-6">{currentCard.word}</h2>
              <div className="text-xl md:text-2xl text-muted-foreground italic leading-relaxed bg-muted/50 p-6 rounded-xl border">
                "{renderSentence()}"
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-8 pointer-events-auto">
              <Button
                variant="outline"
                className="h-16 flex flex-col gap-1 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReview(1)
                }}
              >
                <X className="w-5 h-5" />
                <span className="text-xs">Errei</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col gap-1 border-orange-500/30 hover:bg-orange-500/10 hover:text-orange-500"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReview(3)
                }}
              >
                <Frown className="w-5 h-5" />
                <span className="text-xs">Difícil</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col gap-1 border-success/30 hover:bg-success/10 hover:text-success"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReview(4)
                }}
              >
                <Check className="w-5 h-5" />
                <span className="text-xs">Bom</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col gap-1 border-primary/30 hover:bg-primary/10 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReview(5)
                }}
              >
                <Smile className="w-5 h-5" />
                <span className="text-xs">Fácil</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Required CSS additions for 3D flip within component to keep it self-contained */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  )
}
