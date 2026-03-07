import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Play, FileText, CheckCircle2 } from 'lucide-react'
import { WordInteraction } from '@/components/reader/WordInteraction'

const defaultText = `The quick brown fox jumps over the lazy dog. 
This is a serendipity moment where you can learn new words.
Reading ephemeral texts ubiquitous on the internet helps improve your active vocabulary.`

export default function Reader() {
  const [inputText, setInputText] = useState(defaultText)
  const [isReadingMode, setIsReadingMode] = useState(false)

  const processedContent = useMemo(() => {
    if (!isReadingMode) return null

    const sentences = inputText.match(/[^.!?]+[.!?]+/g) || [inputText]

    return sentences.map((sentence, sIdx) => {
      const tokens = sentence.split(/([\s.,!?;:]+)/)

      return (
        <span key={sIdx} className="mr-1">
          {tokens.map((token, tIdx) => {
            if (/^[\s.,!?;:]+$/.test(token)) {
              return <span key={tIdx}>{token}</span>
            }
            return <WordInteraction key={tIdx} word={token} sentence={sentence} />
          })}
        </span>
      )
    })
  }, [inputText, isReadingMode])

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto h-full flex flex-col">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Leitor Imersivo</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Cole um texto em inglês, leia e clique nas palavras que não conhece.
        </p>
      </header>

      {!isReadingMode ? (
        <div className="flex-1 flex flex-col gap-6 animate-fade-in-up">
          <Card className="flex-1 p-6 flex flex-col border-border bg-card/80 backdrop-blur-sm min-h-[400px] shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-sm font-medium text-primary">
              <FileText className="w-5 h-5" /> Cole seu texto aqui:
            </div>
            <Textarea
              className="flex-1 resize-none text-base md:text-lg p-6 font-sans bg-secondary/30 border-border rounded-[20px] focus-visible:ring-primary shadow-inner"
              placeholder="Paste English text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </Card>
          <Button
            size="lg"
            className="w-full h-16 text-lg shadow-md group"
            onClick={() => {
              if (inputText.trim()) setIsReadingMode(true)
            }}
          >
            <Play
              className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform"
              fill="currentColor"
            />
            Iniciar Leitura
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 animate-fade-in-up">
          <Card className="flex-1 p-8 md:p-12 text-lg md:text-xl leading-relaxed font-serif bg-card text-foreground min-h-[400px] overflow-y-auto border-t-4 border-t-primary shadow-md relative">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none rounded-[24px]" />
            <div className="relative z-10">{processedContent}</div>
          </Card>

          <div className="flex justify-between items-center bg-card/80 backdrop-blur-md p-4 px-6 rounded-full border border-border shadow-sm">
            <div className="text-sm font-medium flex items-center gap-3 text-muted-foreground">
              <div className="p-1.5 bg-success/20 rounded-full">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              Clique nas palavras para capturar o contexto
            </div>
            <Button
              variant="outline"
              className="rounded-full bg-background hover:bg-secondary border-border"
              onClick={() => setIsReadingMode(false)}
            >
              Editar Texto
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
