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

  // Split text into sentences, then words, keeping punctuation
  const processedContent = useMemo(() => {
    if (!isReadingMode) return null

    // Simple sentence splitter (rough approximation)
    const sentences = inputText.match(/[^.!?]+[.!?]+/g) || [inputText]

    return sentences.map((sentence, sIdx) => {
      // Split by words and punctuation, keeping both
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
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto h-full flex flex-col">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Leitor Imersivo</h1>
        <p className="text-muted-foreground mt-2">
          Cole um texto em inglês, leia e clique nas palavras que não conhece.
        </p>
      </header>

      {!isReadingMode ? (
        <div className="flex-1 flex flex-col gap-4 animate-fade-in-up">
          <Card className="flex-1 p-4 shadow-soft min-h-[400px] flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
              <FileText className="w-4 h-4" /> Cole seu texto aqui:
            </div>
            <Textarea
              className="flex-1 resize-none text-base md:text-lg p-4 font-sans focus-visible:ring-primary/50"
              placeholder="Paste English text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </Card>
          <Button
            size="lg"
            className="w-full h-14 text-lg shadow-soft hover:shadow-hover transition-all"
            onClick={() => {
              if (inputText.trim()) setIsReadingMode(true)
            }}
          >
            <Play className="w-5 h-5 mr-2" fill="currentColor" />
            Iniciar Leitura
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 animate-fade-in-up">
          <Card className="flex-1 p-6 md:p-8 shadow-soft text-lg md:text-xl leading-relaxed font-serif bg-[#fdfdfc] text-[#2d3748] min-h-[400px] overflow-y-auto border-t-4 border-t-primary">
            {processedContent}
          </Card>

          <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Clique nas palavras para salvar
            </div>
            <Button variant="outline" onClick={() => setIsReadingMode(false)}>
              Editar Texto
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
