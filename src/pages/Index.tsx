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
    <div className="space-y-8 animate-fade-in-up">
      <header className="mb-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Bem-vindo de volta!</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Pronto para transformar seu vocabulário passivo em ativo?
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-primary/10 border-primary/20 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
              <BrainCircuit className="w-5 h-5" />
              Revisão Diária
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{srsPending}</div>
            <p className="text-sm text-primary/80 mt-1 font-medium">Cards aguardando revisão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-warning flex items-center gap-2">
              <Hammer className="w-5 h-5" />
              Na Oficina
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{builderPending}</div>
            <p className="text-sm text-muted-foreground mt-1">Palavras para construir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-success flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Vocabulário Ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{mastered}</div>
            <p className="text-sm text-muted-foreground mt-1">
              De {learning + mastered} palavras totais
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        <div className="space-y-5">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground/90">
            <TrendingUp className="w-5 h-5 text-primary" /> Ações Rápidas
          </h2>
          <div className="grid gap-4">
            <Button asChild size="lg" className="w-full justify-start h-16 text-base group">
              <Link to="/reader">
                <BookOpen className="w-5 h-5 mr-3 text-primary-foreground/80 group-hover:text-primary-foreground transition-colors" />
                Ler Novo Texto
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant={srsPending > 0 ? 'default' : 'outline'}
              className="w-full justify-start h-16 text-base relative overflow-hidden group"
            >
              <Link to="/flashcards">
                <BrainCircuit className="w-5 h-5 mr-3 relative z-10" />
                <span className="relative z-10">Revisar Flashcards</span>
                {srsPending > 0 && (
                  <span className="absolute right-4 bg-background/30 text-primary-foreground text-xs px-3 py-1 rounded-full z-10 font-bold backdrop-blur-sm">
                    {srsPending} pendentes
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </div>

        <Card className="p-8 border-white/5 bg-card/50">
          <h3 className="font-semibold text-lg mb-6">Como o LangFlow funciona?</h3>
          <ul className="space-y-6 text-sm text-muted-foreground">
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-base shadow-[0_0_15px_rgba(108,63,197,0.2)]">
                1
              </span>
              <p className="pt-1 leading-relaxed">
                <strong className="text-foreground">Leitor:</strong> Leia textos reais, clique nas
                palavras desconhecidas para capturá-las com contexto.
              </p>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-warning/20 text-warning flex items-center justify-center font-bold text-base shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                2
              </span>
              <p className="pt-1 leading-relaxed">
                <strong className="text-foreground">Construtor:</strong> Force a produção ativa
                montando as frases originais como um quebra-cabeça.
              </p>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center font-bold text-base shadow-[0_0_15px_rgba(22,163,74,0.2)]">
                3
              </span>
              <p className="pt-1 leading-relaxed">
                <strong className="text-foreground">Revisão:</strong> Mantenha o vocabulário fresco
                na memória com nosso sistema de repetição espaçada.
              </p>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
