import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react'

interface QuickPracticeProps {
  word: string
  translation: string
  onComplete: () => void
}

const practiceMocks: Record<string, { pt: string; en: string }> = {
  the: { pt: 'O carro é azul.', en: 'The car is blue' },
  is: { pt: 'Ele é alto.', en: 'He is tall' },
  quick: { pt: 'Ele é muito rápido.', en: 'He is very quick' },
  brown: { pt: 'O urso marrom.', en: 'The brown bear' },
  fox: { pt: 'A raposa esperta.', en: 'The smart fox' },
  jumps: { pt: 'O gato pula.', en: 'The cat jumps' },
  over: { pt: 'O avião voa sobre a cidade.', en: 'The plane flies over the city' },
  lazy: { pt: 'O cachorro preguiçoso.', en: 'The lazy dog' },
  dog: { pt: 'O cachorro late.', en: 'The dog barks' },
  serendipity: { pt: 'Foi uma descoberta feliz por acaso.', en: 'It was a serendipity' },
  ephemeral: { pt: 'A arte efêmera.', en: 'The ephemeral art' },
  ubiquitous: { pt: 'A tecnologia é onipresente.', en: 'Technology is ubiquitous' },
}

export function QuickPractice({ word, translation, onComplete }: QuickPracticeProps) {
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle')

  const mock = practiceMocks[word] || {
    pt: `Eu vi um(a) ${translation} hoje.`,
    en: `I saw a ${word} today`,
  }

  const checkAnswer = () => {
    const cleanInput = answer
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .trim()
    const cleanExpected = mock.en
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .trim()

    if (
      cleanInput === cleanExpected ||
      (cleanInput.length > 5 && cleanInput.includes(word.toLowerCase()))
    ) {
      setStatus('correct')
    } else {
      setStatus('incorrect')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up flex flex-col h-full">
      <div className="flex items-center text-primary mb-2">
        <div className="p-2 bg-primary/10 rounded-full mr-3">
          <ArrowRight className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-xl">Quick Practice</h3>
      </div>

      <div className="space-y-2 bg-secondary/30 p-5 rounded-2xl border border-border">
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
          Traduza para o inglês
        </p>
        <p className="text-xl font-medium text-foreground">{mock.pt}</p>
      </div>

      <div className="space-y-4 flex-1">
        <Input
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value)
            setStatus('idle')
          }}
          placeholder="Digite sua tradução aqui..."
          className={`h-14 text-lg transition-colors ${
            status === 'incorrect'
              ? 'border-destructive focus-visible:ring-destructive'
              : status === 'correct'
                ? 'border-success focus-visible:ring-success'
                : ''
          }`}
          onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
          autoFocus
        />

        {status === 'incorrect' && (
          <div className="text-destructive text-sm flex items-center gap-2 bg-destructive/10 p-3 rounded-lg animate-fade-in">
            <XCircle className="w-5 h-5 shrink-0" />
            <span>
              Tente novamente. Dica: certifique-se de usar a palavra <strong>"{word}"</strong>.
            </span>
          </div>
        )}

        {status === 'correct' && (
          <div className="text-success text-sm flex items-center gap-2 bg-success/10 p-3 rounded-lg animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Correto! Excelente trabalho.</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-4 mt-auto">
        {status === 'correct' ? (
          <Button onClick={onComplete} size="lg" className="w-full text-lg">
            Concluir <CheckCircle2 className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={checkAnswer}
            size="lg"
            className="w-full text-lg"
            disabled={!answer.trim()}
          >
            Verificar Resposta
          </Button>
        )}
      </div>
    </div>
  )
}
