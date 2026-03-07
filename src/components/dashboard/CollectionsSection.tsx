import { Card } from '@/components/ui/card'
import { Plus } from 'lucide-react'

export function CollectionsSection() {
  return (
    <section className="space-y-6 pb-8">
      <header className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-foreground tracking-tight">Suas Coleções</h3>
        <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-white/5 rounded-[24px] group cursor-pointer transition-all duration-[250ms] hover:scale-[1.02] hover:border-white/10">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 mb-4 flex items-center justify-center">
            <span className="text-2xl">✈️</span>
          </div>
          <h4 className="font-bold text-lg text-foreground group-hover:text-blue-400 transition-colors">
            Viagem para Londres
          </h4>
          <p className="text-sm text-muted-foreground mt-1">124 palavras • 80% retido</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-white/5 rounded-[24px] group cursor-pointer transition-all duration-[250ms] hover:scale-[1.02] hover:border-white/10 border-dashed">
          <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
            <Plus className="w-8 h-8 mb-2 opacity-50" />
            <span className="font-medium text-sm">Criar nova coleção</span>
          </div>
        </Card>
      </div>
    </section>
  )
}
