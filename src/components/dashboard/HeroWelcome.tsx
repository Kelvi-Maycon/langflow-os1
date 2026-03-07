import { Button } from '@/components/ui/button'
import { Play, Map } from 'lucide-react'

export function HeroWelcome() {
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#2A1A1A] to-card border border-white/5 p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group">
      {/* Background glowing effects */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/30 transition-colors duration-700" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-warning/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex-1 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-wider text-muted-foreground mb-6">
          <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          SESSÃO RECOMENDADA
        </div>

        <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
          Pronto para <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-primary">
            Domínio Fluente?
          </span>
        </h2>

        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Você está a 85% do seu objetivo semanal. Mantenha o foco para desbloquear o Certificado
          B2.
        </p>

        <div className="flex flex-wrap gap-4">
          <Button
            size="lg"
            className="rounded-full bg-pink-500 hover:bg-pink-600 text-white border-0 h-14 px-8 text-base font-bold shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all duration-300 hover:scale-[1.04] active:scale-[0.98]"
          >
            <Play className="w-5 h-5 mr-2 fill-current" /> Continuar Jornada
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full bg-white/5 border-white/10 hover:bg-white/10 hover:text-white h-14 px-8 text-base font-bold transition-all duration-300 hover:scale-[1.04] active:scale-[0.98]"
          >
            <Map className="w-5 h-5 mr-2" /> Ver Caminho
          </Button>
        </div>
      </div>

      <div className="relative z-10 hidden md:flex items-center justify-center w-64 h-64">
        {/* Abstract decorative element representing the badge/medal */}
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 to-primary/20 rounded-[40px] rotate-12 blur-sm" />
        <div className="absolute inset-0 bg-card border border-white/10 rounded-[40px] -rotate-6 shadow-2xl flex items-center justify-center backdrop-blur-xl transition-transform duration-500 group-hover:rotate-0">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-primary flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.4)]">
            <svg
              viewBox="0 0 24 24"
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
