import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen, Check } from 'lucide-react'
import { useStore } from '@/store/main'
import { useToast } from '@/hooks/use-toast'

interface WordInteractionProps {
  word: string
  sentence: string
}

const mockDictionary: Record<string, string> = {
  the: 'o, a, os, as',
  is: 'é, está',
  quick: 'rápido',
  brown: 'marrom',
  fox: 'raposa',
  jumps: 'pula',
  over: 'sobre',
  lazy: 'preguiçoso',
  dog: 'cachorro',
  serendipity: 'serendipidade (descoberta feliz por acaso)',
  ephemeral: 'efêmero',
  ubiquitous: 'onipresente',
}

export function WordInteraction({ word, sentence }: WordInteractionProps) {
  const [open, setOpen] = useState(false)
  const { addWord, words } = useStore()
  const { toast } = useToast()

  const cleanWord = word.replace(/[^\w-]/g, '').toLowerCase()
  const isAlreadySaved = words.some((w) => w.word.toLowerCase() === cleanWord)

  const mockTranslation = mockDictionary[cleanWord] || `tradução de "${cleanWord}"`

  const handleSave = () => {
    if (!cleanWord) return

    addWord({
      word: cleanWord,
      translation: mockTranslation,
      contextSentence: sentence.trim(),
      status: 'builder',
    })

    toast({
      title: 'Palavra capturada!',
      description: `"${cleanWord}" adicionada à sua oficina.`,
    })
    setOpen(false)
  }

  if (!cleanWord) {
    return <span>{word}</span>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span className="cursor-pointer hover:bg-primary/30 hover:text-primary-foreground hover:shadow-[0_0_10px_rgba(108,63,197,0.5)] transition-all rounded-md px-1 py-0.5 mx-0.5 inline-block">
          {word}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-5 glass z-50 animate-fade-in-up rounded-[24px] border-white/10"
        sideOffset={8}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/20 rounded-xl">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-xl leading-none text-foreground font-sans">
                {cleanWord}
              </h4>
              <p className="text-sm text-primary/80 font-medium mt-1.5">{mockTranslation}</p>
            </div>
          </div>

          <div className="text-sm bg-background/40 p-4 rounded-xl italic text-muted-foreground border-l-2 border-primary font-sans leading-relaxed">
            "{sentence.trim()}"
          </div>

          <Button
            className="w-full mt-2 h-12"
            onClick={handleSave}
            disabled={isAlreadySaved}
            variant={isAlreadySaved ? 'secondary' : 'default'}
          >
            {isAlreadySaved ? (
              <>
                <Check className="w-4 h-4 mr-2 text-success" /> Já está na sua lista
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" /> Adicionar ao Construtor
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
