import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Trophy, BookOpen, Mic } from 'lucide-react'
import { WeeklyChart } from './WeeklyChart'

export function StatsSidebar() {
  return (
    <div className="space-y-6">
      {/* Próxima Conquista */}
      <Card className="p-8 bg-card border-white/5 rounded-[32px] flex flex-col items-center text-center">
        <span className="text-xs font-bold tracking-widest text-muted-foreground mb-8">
          PRÓXIMA CONQUISTA
        </span>

        <div className="relative mb-6">
          <div className="absolute inset-0 bg-warning/20 blur-xl rounded-full" />
          <div className="w-24 h-24 rounded-full border-[4px] border-warning/30 border-t-warning flex items-center justify-center relative bg-card shadow-inner rotate-45">
            <div className="-rotate-45">
              <Trophy className="w-10 h-10 text-warning fill-warning/20" />
            </div>
          </div>
        </div>

        <h4 className="text-2xl font-bold text-foreground mb-2">Poliglota Jr.</h4>
        <p className="text-sm text-muted-foreground mb-8">
          Complete 3.000 palavras para desbloquear
        </p>

        <div className="w-full space-y-2">
          <Progress
            value={82}
            className="h-2 bg-white/5 [&>div]:bg-gradient-to-r [&>div]:from-pink-500 [&>div]:to-orange-400"
          />
          <div className="flex justify-between text-xs font-bold text-muted-foreground">
            <span>2.450 / 3.000</span>
            <span className="text-foreground">82%</span>
          </div>
        </div>
      </Card>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 bg-card/50 border-white/5 rounded-[24px] flex flex-col items-center text-center justify-center gap-3 transition-all duration-300 hover:scale-[1.04]">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">2.4k</div>
            <div className="text-[10px] font-bold tracking-wider text-muted-foreground mt-0.5">
              VOCABULÁRIO
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-card/50 border-white/5 rounded-[24px] flex flex-col items-center text-center justify-center gap-3 transition-all duration-300 hover:scale-[1.04]">
          <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
            <Mic className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">88%</div>
            <div className="text-[10px] font-bold tracking-wider text-muted-foreground mt-0.5">
              PRONÚNCIA
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <WeeklyChart />
    </div>
  )
}
