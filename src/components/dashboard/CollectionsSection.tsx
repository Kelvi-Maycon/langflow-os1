import { Card } from '@/components/ui/card'
import { Zap, BrainCircuit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/main'

export function CollectionsSection() {
  const navigate = useNavigate()
  const { words } = useStore()

  const srsCount = words.filter((w) => w.status === 'srs').length
  const practiceCount = words.filter((w) => w.status === 'practice').length

  return (
    <section className="space-y-6 pb-8">
      <header className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-foreground tracking-tight">Suas Filas de Estudo</h3>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          onClick={() => navigate('/flashcards')}
          className="p-6 bg-card border-border shadow-sm rounded-[24px] group cursor-pointer transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md hover:border-purple-500/30 active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 mb-4 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <BrainCircuit className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="font-bold text-lg text-foreground group-hover:text-purple-600 transition-colors">
            Revisão Espaçada (SRS)
          </h4>
          <p className="text-sm text-muted-foreground mt-1">{srsCount} palavras aguardando</p>
        </Card>

        <Card
          onClick={() => navigate('/practice')}
          className="p-6 bg-card border-border shadow-sm rounded-[24px] group cursor-pointer transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-md hover:border-pink-500/30 active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 mb-4 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
            <Zap className="w-6 h-6 text-pink-500 fill-current" />
          </div>
          <h4 className="font-bold text-lg text-foreground group-hover:text-pink-600 transition-colors">
            Prática Rápida
          </h4>
          <p className="text-sm text-muted-foreground mt-1">{practiceCount} palavras na fila</p>
        </Card>
      </div>
    </section>
  )
}
