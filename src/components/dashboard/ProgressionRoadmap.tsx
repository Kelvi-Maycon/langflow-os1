import { Card } from '@/components/ui/card'
import { ArrowRight, Check, Lock } from 'lucide-react'

const steps = [
  { id: 1, label: 'BÁSICO I', status: 'completed' },
  { id: 2, label: 'BÁSICO II', status: 'completed' },
  { id: 3, label: 'INTERMEDIÁRIO', status: 'current', tooltip: 'NÍVEL ATUAL B1' },
  { id: 4, label: 'AVANÇADO', status: 'locked' },
  { id: 5, label: 'MESTRE', status: 'locked' },
]

export function ProgressionRoadmap() {
  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-foreground tracking-tight">Jornada de Maestria</h3>
        <button className="text-sm font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors">
          Ver Mapa Completo <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      <Card className="p-8 bg-card/50 border-white/5 rounded-[24px] overflow-x-auto">
        <div className="min-w-[600px] relative flex items-center justify-between pt-8 pb-4">
          {/* Connecting Line */}
          <div className="absolute top-[48px] left-[10%] right-[10%] h-[3px] bg-white/10 -z-10 rounded-full">
            <div className="h-full bg-gradient-to-r from-pink-500 to-pink-500/50 w-1/2 rounded-full" />
          </div>

          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-4 relative z-10 w-24">
              {step.tooltip && (
                <div className="absolute -top-12 bg-[#2A1A1A] text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/10 whitespace-nowrap shadow-lg">
                  {step.tooltip}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#2A1A1A] border-b border-r border-white/10 rotate-45" />
                </div>
              )}

              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] transition-transform duration-300 ${
                  step.status === 'completed'
                    ? 'bg-[#2A1A1A] border-white/20 text-white'
                    : step.status === 'current'
                      ? 'bg-pink-500 border-pink-500/30 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] scale-125'
                      : 'bg-card border-white/10 text-white/30'
                }`}
              >
                {step.status === 'completed' && <Check className="w-5 h-5" />}
                {step.status === 'current' && <div className="w-3 h-3 bg-white rounded-full" />}
                {step.status === 'locked' && <Lock className="w-4 h-4" />}
              </div>

              <span
                className={`text-[11px] font-bold tracking-wider ${
                  step.status === 'current' ? 'text-pink-400' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}
