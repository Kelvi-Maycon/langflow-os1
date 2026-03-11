import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Check, BookOpen, Zap, BrainCircuit } from 'lucide-react'
import { useStore } from '@/store/main'
import { useNavigate } from 'react-router-dom'

export function MissionsToday() {
  const { stats, words } = useStore()
  const navigate = useNavigate()

  const missions = [
    {
      id: 1,
      title: 'Leitura e Captura',
      subtitle: 'Adicione 5 novas palavras no Leitor',
      xp: '+50 XP',
      icon: BookOpen,
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-500',
      progress: Math.min((words.length / 5) * 100, 100),
      completed: words.length >= 5,
      path: '/reader',
    },
    {
      id: 2,
      title: 'Prática Rápida',
      subtitle: 'Faça 5 tentativas na Prática',
      xp: '+80 XP',
      icon: Zap,
      iconBg: 'bg-warning/15',
      iconColor: 'text-warning',
      progress: Math.min((stats.practiceAttempts / 5) * 100, 100),
      completed: stats.practiceAttempts >= 5,
      path: '/practice',
    },
    {
      id: 3,
      title: 'Revisão SRS',
      subtitle: 'Complete 5 revisões de flashcards',
      xp: '+120 XP',
      icon: BrainCircuit,
      iconBg: 'bg-pink-500/15',
      iconColor: 'text-pink-600',
      progress: Math.min((stats.flashcardAttempts / 5) * 100, 100),
      completed: stats.flashcardAttempts >= 5,
      path: '/flashcards',
    },
  ]

  const completedCount = missions.filter((m) => m.completed).length

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground tracking-tight">Missões de Hoje</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Complete as tarefas para ganhar XP bônus
          </p>
        </div>
        <div className="bg-pink-500/10 text-pink-600 font-bold text-sm px-4 py-1.5 rounded-full border border-pink-500/20">
          {completedCount}/{missions.length} Completas
        </div>
      </header>

      <div className="space-y-3">
        {missions.map((mission) => {
          const Icon = mission.completed ? Check : mission.icon
          return (
            <Card
              key={mission.id}
              onClick={() => navigate(mission.path)}
              className={`p-5 flex items-center gap-5 bg-card hover:bg-secondary/40 border-border shadow-sm transition-all duration-250 ease-out hover:scale-[1.02] hover:shadow-md cursor-pointer active:scale-[0.98] rounded-[24px] ${mission.completed ? 'opacity-60 bg-success/5 border-success/20' : ''}`}
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${mission.completed ? 'bg-success/15' : mission.iconBg}`}
              >
                <Icon
                  className={`w-6 h-6 transition-colors duration-500 ${mission.completed ? 'text-success' : mission.iconColor}`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-foreground text-lg truncate">{mission.title}</h4>
                <p className="text-sm text-muted-foreground truncate">{mission.subtitle}</p>
                <Progress value={mission.progress} className="h-1.5 mt-3 w-1/2" />
              </div>

              <div className="font-bold text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-full whitespace-nowrap border border-border/60">
                {mission.xp}
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
