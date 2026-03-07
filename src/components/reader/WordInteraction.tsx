import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen } from 'lucide-react'
import { useStore } from '@/store/main'
import { useToast } from '@/hooks/use-toast'

interface WordInteractionProps {
  word: string
  sentence: string
}

// A simple mock dictionary for demonstration
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
}

export function WordInteraction({ word, sentence }: WordInteractionProps) {
  const [open, setOpen] = useState(false)
  const { addWord, words } = useStore()
  const { toast } = useToast()

  const cleanWord = word.replace(/[^\w-]/g, '').toLowerCase()
  const isAlreadySaved = words.some((w) => w.word.toLowerCase() === cleanWord)

  // Mock translation - in a real app, this would call an API
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

  // If it's not a word character, just render it normally
  if (!cleanWord) {
    return <span>{word}</span>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors rounded px-0.5">
          {word}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 shadow-hover z-50 animate-fade-in-up" sideOffset={5}>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <BookOpen className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-bold text-lg leading-none">{cleanWord}</h4>
              <p className="text-sm text-muted-foreground mt-1">{mockTranslation}</p>
            </div>
          </div>

          <div className="text-xs bg-muted p-2 rounded italic text-muted-foreground border-l-2 border-primary">
            "{sentence.trim()}"
          </div>

          <Button className="w-full mt-2" size="sm" onClick={handleSave} disabled={isAlreadySaved}>
            {isAlreadySaved ? (
              'Já está na sua lista'
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar ao Construtor
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
