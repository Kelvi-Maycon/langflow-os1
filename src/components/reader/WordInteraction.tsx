import { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { BookOpen, Plus, Loader2 } from 'lucide-react'
import { useStore } from '@/store/main'
import { useToast } from '@/hooks/use-toast'

interface WordInteractionProps {
  word: string
  sentence: string
  onCapture: (word: string, translation: string, sentence: string) => void
}

const mockDictionary: Record<string, { translation: string; explanation: string }> = {
  the: {
    translation: 'o, a, os, as',
    explanation: 'Artigo definido usado para indicar um substantivo específico.',
  },
  is: {
    translation: 'é, está',
    explanation: 'Terceira pessoa do singular do verbo "to be".',
  },
  quick: {
    translation: 'rápido',
    explanation: 'Adjetivo que descreve algo que se move com velocidade.',
  },
  brown: {
    translation: 'marrom',
    explanation: 'Cor resultante da mistura de vermelho, amarelo e preto.',
  },
  fox: {
    translation: 'raposa',
    explanation: 'Mamífero carnívoro da família dos canídeos.',
  },
  jumps: {
    translation: 'pula',
    explanation: 'Terceira pessoa do singular do verbo "to jump".',
  },
  over: {
    translation: 'sobre',
    explanation: 'Preposição que indica posição superior.',
  },
  lazy: {
    translation: 'preguiçoso',
    explanation: 'Adjetivo para descrever alguém que evita esforço.',
  },
  dog: {
    translation: 'cachorro',
    explanation: 'Mamífero doméstico frequentemente mantido como pet.',
  },
  serendipity: {
    translation: 'serendipidade',
    explanation: 'Ocorrência de eventos por acaso de maneira feliz.',
  },
  ephemeral: {
    translation: 'efêmero',
    explanation: 'Algo que dura por um tempo muito curto; transitório.',
  },
  ubiquitous: {
    translation: 'onipresente',
    explanation: 'Presente ou encontrado em todos os lugares.',
  },
}

export function WordInteraction({ word, sentence, onCapture }: WordInteractionProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { settings } = useStore()
  const { toast } = useToast()

  const cleanWord = word.replace(/[^\w-]/g, '').toLowerCase()

  const mockData = mockDictionary[cleanWord] || {
    translation: `tradução de "${cleanWord}"`,
    explanation: `Uma explicação detalhada sobre como usar a palavra "${cleanWord}" no contexto da frase. Esta análise foi gerada com a ajuda do modelo ${
      settings.aiModel || 'gpt-4o-mini'
    }.`,
  }

  useEffect(() => {
    if (open) {
      setIsLoading(true)
      const timer = setTimeout(() => setIsLoading(false), 500)
      return () => clearTimeout(timer)
    }
  }, [open])

  if (!cleanWord) return <span>{word}</span>

  const handleCaptureClick = () => {
    onCapture(cleanWord, mockData.translation, sentence.trim())
    setOpen(false)
    toast({
      title: 'Palavra capturada',
      description: `"${cleanWord}" foi adicionada à lista capturada.`,
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors rounded px-1 py-0.5 mx-0.5 inline-block border-b-2 border-transparent hover:border-primary/40 data-[state=open]:bg-primary/20 data-[state=open]:text-primary">
          {word}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="w-[320px] p-5 shadow-xl border-border/60 bg-card rounded-xl z-50"
      >
        {isLoading ? (
          <div className="py-8 flex justify-center items-center flex-col gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm font-medium animate-pulse">
              Consultando {settings.aiModel || 'gpt-4o-mini'}...
            </p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-xl leading-none text-foreground">{cleanWord}</h4>
                <p className="text-sm text-primary font-medium mt-1.5">{mockData.translation}</p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground bg-secondary/40 p-3.5 rounded-lg leading-relaxed">
              {mockData.explanation}
            </div>

            <Button className="w-full mt-2 shadow-sm" onClick={handleCaptureClick}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar a Palavras Capturadas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
