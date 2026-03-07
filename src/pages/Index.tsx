import { useStore } from '@/store/main'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { BrainCircuit, BookOpen, Hammer, CheckCircle2, TrendingUp } from 'lucide-react'

export default function Index() {
  const { words } = useStore()

  const srsPending = words.filter(
    (w) => w.status === 'srs' && w.nextReviewDate <= Date.now(),
  ).length
  const builderPending = words.filter((w) => w.status === 'builder').length
  const mastered = words.filter((w) => w.status === 'mastered').length
  const learning = words.filter((w) => w.status !== 'mastered').length

  return (
    <div className="space-y-6 animate-fade-in-up">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Bem-vindo de volta!</h1>
        <p className="text-muted-foreground mt-2">
          Pronto para transformar seu vocabulário passivo em ativo?
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-soft border-none bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-primary" />
              Revisão Diária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{srsPending}</div>
            <p className="text-xs text-muted-foreground mt-1">Cards aguardando revisão</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Hammer className="w-4 h-4 text-orange-500" />
              Na Oficina
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{builderPending}</div>
            <p className="text-xs text-muted-foreground mt-1">Palavras para construir</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Vocabulário Ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{mastered}</div>
            <p className="text-xs text-muted-foreground mt-1">
              De {learning + mastered} palavras totais
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Ações Rápidas
          </h2>
          <div className="grid gap-3">
            <Button
              asChild
              size="lg"
              className="w-full justify-start h-14 shadow-soft hover:shadow-hover transition-all"
            >
              <Link to="/reader">
                <BookOpen className="w-5 h-5 mr-3" />
                Ler Novo Texto
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant={srsPending > 0 ? 'default' : 'outline'}
              className="w-full justify-start h-14 shadow-soft hover:shadow-hover transition-all relative overflow-hidden group"
            >
              <Link to="/flashcards">
                <BrainCircuit className="w-5 h-5 mr-3 relative z-10" />
                <span className="relative z-10">Revisar Flashcards</span>
                {srsPending > 0 && (
                  <span className="absolute right-4 bg-background/20 text-white text-xs px-2 py-1 rounded-full z-10">
                    {srsPending} pendentes
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-soft border">
          <h3 className="font-semibold mb-4">Como o LangFlow funciona?</h3>
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                1
              </span>
              <p>
                <strong>Leitor:</strong> Leia textos reais, clique nas palavras desconhecidas para
                capturá-las com contexto.
              </p>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                2
              </span>
              <p>
                <strong>Construtor:</strong> Force a produção ativa montando as frases originais
                como um quebra-cabeça.
              </p>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-success/10 text-success flex items-center justify-center font-bold">
                3
              </span>
              <p>
                <strong>Revisão:</strong> Mantenha o vocabulário fresco na memória com nosso sistema
                de repetição espaçada.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
