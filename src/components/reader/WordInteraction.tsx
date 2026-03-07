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
    explanation: `Análise gerada usando o modelo ${
      settings.aiModel || 'gpt-4o-mini'
    } para o contexto atual.`,
  }

  useEffect(() => {
    if (open) {
      setIsLoading(true)
      const timer = setTimeout(() => setIsLoading(false), 400)
      return () => clearTimeout(timer)
    }
  }, [open])

  if (!cleanWord) return <span>{word}</span>

  const handleCaptureClick = () => {
    onCapture(cleanWord, mockData.translation, sentence.trim())
    setOpen(false)
    toast({
      title: 'Palavra capturada',
      description: `"${cleanWord}" foi adicionada com sucesso.`,
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
        sideOffset={6}
        className="w-[260px] p-4 shadow-xl border-border/60 bg-popover rounded-xl z-50"
      >
        {isLoading ? (
          <div className="py-6 flex justify-center items-center flex-col gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-xs font-medium animate-pulse">Buscando definição...</p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-lg leading-none text-foreground">{cleanWord}</h4>
                <p className="text-sm text-primary font-medium mt-1">{mockData.translation}</p>
              </div>
              <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-secondary/50 p-2.5 rounded-lg leading-relaxed">
              {mockData.explanation}
            </div>

            <Button
              size="sm"
              className="w-full mt-1 shadow-sm h-8 text-xs font-semibold"
              onClick={handleCaptureClick}
            >
              <Plus className="w-3 h-3 mr-1.5" /> Adicionar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
