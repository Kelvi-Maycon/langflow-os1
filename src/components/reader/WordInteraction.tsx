import { useState, useEffect } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen, Check, Loader2, ArrowRight } from 'lucide-react'
import { useStore } from '@/store/main'
import { useToast } from '@/hooks/use-toast'
import { QuickPractice } from './QuickPractice'

interface WordInteractionProps {
  word: string
  sentence: string
}

const mockDictionary: Record<string, { translation: string; explanation: string }> = {
  the: {
    translation: 'o, a, os, as',
    explanation:
      'Artigo definido usado para indicar um substantivo específico que já é conhecido pelo leitor ou ouvinte.',
  },
  is: {
    translation: 'é, está',
    explanation: 'Terceira pessoa do singular do verbo "to be" (ser/estar) no presente.',
  },
  quick: {
    translation: 'rápido',
    explanation:
      'Adjetivo que descreve algo que se move com velocidade ou acontece em pouco tempo.',
  },
  brown: {
    translation: 'marrom',
    explanation: 'Cor resultante da mistura de vermelho, amarelo e preto.',
  },
  fox: {
    translation: 'raposa',
    explanation: 'Mamífero carnívoro da família dos canídeos, conhecido por sua esperteza.',
  },
  jumps: {
    translation: 'pula',
    explanation: 'Terceira pessoa do singular do verbo "to jump" (pular) no presente.',
  },
  over: {
    translation: 'sobre',
    explanation: 'Preposição que indica posição superior ou movimento por cima de algo.',
  },
  lazy: {
    translation: 'preguiçoso',
    explanation: 'Adjetivo para descrever alguém que evita trabalho ou esforço.',
  },
  dog: {
    translation: 'cachorro',
    explanation:
      'Mamífero doméstico da família dos canídeos, frequentemente mantido como animal de estimação.',
  },
  serendipity: {
    translation: 'serendipidade',
    explanation: 'Ocorrência e desenvolvimento de eventos por acaso de maneira feliz ou benéfica.',
  },
  ephemeral: {
    translation: 'efêmero',
    explanation: 'Algo que dura por um tempo muito curto; transitório.',
  },
  ubiquitous: {
    translation: 'onipresente',
    explanation: 'Presente, aparecendo ou encontrado em todos os lugares ao mesmo tempo.',
  },
}

export function WordInteraction({ word, sentence }: WordInteractionProps) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<'explanation' | 'practice'>('explanation')
  const [isLoading, setIsLoading] = useState(false)
  const { addWord, words, settings } = useStore()
  const { toast } = useToast()

  const cleanWord = word.replace(/[^\w-]/g, '').toLowerCase()
  const isAlreadySaved = words.some((w) => w.word.toLowerCase() === cleanWord)

  const mockData = mockDictionary[cleanWord] || {
    translation: `tradução de "${cleanWord}"`,
    explanation: `Uma explicação detalhada sobre como usar a palavra "${cleanWord}" no contexto da frase. Esta análise foi gerada com a ajuda do modelo ${
      settings.aiModel || 'gpt-4o-mini'
    }.`,
  }

  useEffect(() => {
    if (open && phase === 'explanation') {
      setIsLoading(true)
      const timer = setTimeout(() => setIsLoading(false), 800)
      return () => clearTimeout(timer)
    }
  }, [open, phase])

  const handleSave = () => {
    if (!cleanWord) return
    addWord({
      word: cleanWord,
      translation: mockData.translation,
      contextSentence: sentence.trim(),
      status: 'builder',
    })
    toast({
      title: 'Palavra capturada!',
      description: `"${cleanWord}" adicionada à sua oficina.`,
    })
  }

  if (!cleanWord) return <span>{word}</span>

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setTimeout(() => setPhase('explanation'), 300)
      }}
    >
      <DrawerTrigger asChild>
        <span className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-all rounded-md px-1 py-0.5 mx-0.5 inline-block border-b-2 border-transparent hover:border-primary/50">
          {word}
        </span>
      </DrawerTrigger>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{cleanWord}</DrawerTitle>
          <DrawerDescription>Detailed explanation and practice</DrawerDescription>
        </DrawerHeader>
        <div className="mx-auto w-full max-w-md p-6 min-h-[400px]">
          {phase === 'explanation' ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/20 rounded-2xl">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-3xl leading-none text-foreground font-sans">
                    {cleanWord}
                  </h4>
                  <p className="text-lg text-primary/80 font-medium mt-2">{mockData.translation}</p>
                </div>
              </div>

              {isLoading ? (
                <div className="py-12 flex justify-center items-center flex-col gap-4 text-muted-foreground">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-sm font-medium animate-pulse">
                    Consultando {settings.aiModel || 'gpt-4o-mini'}...
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="text-base bg-secondary/50 p-5 rounded-2xl italic text-foreground border-l-4 border-primary font-sans leading-relaxed shadow-inner">
                    "{sentence.trim()}"
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-semibold text-lg text-foreground">Explicação Detalhada</h5>
                    <p className="text-muted-foreground leading-relaxed text-base">
                      {mockData.explanation}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-4 border-t border-border">
                    <Button
                      size="lg"
                      className="w-full text-base group shadow-md"
                      onClick={() => setPhase('practice')}
                    >
                      Próxima Fase{' '}
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>

                    <Button
                      size="lg"
                      variant={isAlreadySaved ? 'secondary' : 'outline'}
                      className="w-full text-base"
                      onClick={handleSave}
                      disabled={isAlreadySaved}
                    >
                      {isAlreadySaved ? (
                        <>
                          <Check className="w-5 h-5 mr-2 text-success" /> Já na lista
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5 mr-2" /> Salvar Palavra
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <QuickPractice
              word={cleanWord}
              translation={mockData.translation}
              onComplete={() => setOpen(false)}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
