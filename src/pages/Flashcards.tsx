import { useState, useMemo } from 'react'
import { useStore } from '@/store/main'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Check, X, Frown, Smile, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function Flashcards() {
  const { words, reviewWord, recordFlashcardAttempt } = useStore()
  const navigate = useNavigate()

  const dueCards = useMemo(
    () =>
      words
        .filter((w) => w.status === 'srs' && w.nextReviewDate <= Date.now())
        .sort((a, b) => a.nextReviewDate - b.nextReviewDate),
    [words],
  )

  const [sessionCount, setSessionCount] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const currentCard = dueCards[0]
  const totalDue = dueCards.length + sessionCount
  const progress = totalDue > 0 ? (sessionCount / totalDue) * 100 : 100

  const handleReview = (quality: number) => {
    if (!currentCard) return
    recordFlashcardAttempt(quality >= 3)
    reviewWord(currentCard.id, quality)
    setIsFlipped(false)
    setSessionCount((s) => s + 1)
  }

  if (dueCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-fade-in max-w-lg mx-auto">
        <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mb-8 border border-green-100 shadow-sm">
          <Check className="w-14 h-14 text-green-500" />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Session Complete!</h2>
        <p className="text-slate-500 mb-10 text-lg leading-relaxed">
          You've reviewed all your pending flashcards for today. Great job keeping your memory sharp
          and building your fluency.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button
            onClick={() => navigate('/')}
            size="lg"
            className="rounded-full px-8 h-14 text-base shadow-md"
          >
            Back to Dashboard
          </Button>
          <Button
            onClick={() => navigate('/vocabulary')}
            variant="outline"
            size="lg"
            className="rounded-full px-8 h-14 text-base bg-white shadow-sm hover:bg-slate-50 border-slate-200"
          >
            View Vocabulary <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="space-y-3 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between text-sm font-bold text-slate-500 px-2">
          <span>Session Progress</span>
          <span className="text-primary bg-primary/10 px-3 py-1 rounded-full">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>

      <div className="relative perspective-1000 min-h-[500px]">
        <div
          className={cn(
            'w-full h-full absolute top-0 left-0 transition-all duration-700 preserve-3d',
            isFlipped ? 'rotate-y-180' : '',
          )}
        >
          {/* Front */}
          <Card
            className={cn(
              'w-full h-full absolute top-0 left-0 backface-hidden p-10 md:p-16 flex flex-col items-center justify-center shadow-lg border-slate-100 text-center cursor-pointer hover:border-primary/30 transition-colors group',
              isFlipped ? 'pointer-events-none opacity-0' : '',
            )}
            onClick={() => !isFlipped && setIsFlipped(true)}
          >
            <span className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-10 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 shadow-sm">
              Target Translation
            </span>
            <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight capitalize tracking-tight">
              {currentCard.translation}
            </h2>
            <p className="mt-16 text-primary font-bold flex items-center gap-2 bg-primary/5 px-6 py-2.5 rounded-full group-hover:scale-105 transition-transform animate-pulse border border-primary/10">
              Tap card to reveal answer
            </p>
          </Card>

          {/* Back */}
          <Card
            className={cn(
              'w-full h-full absolute top-0 left-0 backface-hidden rotate-y-180 p-8 md:p-12 flex flex-col justify-between shadow-xl border-primary/20 bg-white ring-1 ring-primary/5',
              !isFlipped ? 'pointer-events-none opacity-0' : '',
            )}
          >
            <div className="text-center flex-1 flex flex-col justify-center max-w-xl mx-auto w-full">
              <span className="text-xs font-bold tracking-widest uppercase text-primary mb-8 bg-primary/5 px-4 py-2 rounded-full inline-block self-center border border-primary/10">
                English Word
              </span>
              <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-8 tracking-tight">
                {currentCard.word}
              </h2>
              <div className="text-xl md:text-2xl text-slate-600 italic bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-inner leading-relaxed">
                "{currentCard.contextSentence}"
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pointer-events-auto">
              <Button
                variant="outline"
                className="h-16 rounded-2xl border-red-200 hover:bg-red-50 hover:text-red-700 bg-white shadow-sm text-base font-bold transition-all hover:-translate-y-1"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReview(1)
                }}
              >
                <X className="w-5 h-5 mr-2" /> Incorrect
              </Button>
              <Button
                variant="outline"
                className="h-16 rounded-2xl border-orange-200 hover:bg-orange-50 hover:text-orange-700 bg-white shadow-sm text-base font-bold transition-all hover:-translate-y-1"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReview(3)
                }}
              >
                <Frown className="w-5 h-5 mr-2" /> Hard
              </Button>
              <Button
                variant="outline"
                className="h-16 rounded-2xl border-green-200 hover:bg-green-50 hover:text-green-700 bg-white shadow-sm text-base font-bold transition-all hover:-translate-y-1"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReview(4)
                }}
              >
                <Check className="w-5 h-5 mr-2" /> Good
              </Button>
              <Button
                variant="outline"
                className="h-16 rounded-2xl border-blue-200 hover:bg-blue-50 hover:text-blue-700 bg-white shadow-sm text-base font-bold transition-all hover:-translate-y-1"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReview(5)
                }}
              >
                <Smile className="w-5 h-5 mr-2" /> Easy
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1200px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  )
}
