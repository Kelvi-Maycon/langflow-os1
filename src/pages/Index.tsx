import { Search, Flame, Bell } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { HeroWelcome } from '@/components/dashboard/HeroWelcome'
import { MissionsToday } from '@/components/dashboard/MissionsToday'
import { ProgressionRoadmap } from '@/components/dashboard/ProgressionRoadmap'
import { StatsSidebar } from '@/components/dashboard/StatsSidebar'
import { CollectionsSection } from '@/components/dashboard/CollectionsSection'

export default function Index() {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Bar Area */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Olá, Bruno!</h1>
          <p className="text-xs font-bold tracking-widest text-muted-foreground mt-1 uppercase">
            Bom dia • Quinta-feira, 24 Out
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64 hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lição..."
              className="pl-9 bg-card/50 border-white/5 rounded-full h-10 text-sm focus-visible:ring-1 focus-visible:ring-white/20"
            />
          </div>

          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full text-orange-400 font-bold text-sm shadow-[0_0_15px_rgba(249,115,22,0.1)]">
            <Flame className="w-4 h-4 fill-current" />
            12 Dias
          </div>

          <button className="w-10 h-10 rounded-full border border-white/5 bg-card/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-pink-500 border-2 border-background" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <HeroWelcome />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pt-4">
        {/* Left Column (Missions, Roadmap, Collections) */}
        <div className="xl:col-span-2 space-y-12">
          <MissionsToday />
          <ProgressionRoadmap />
          <CollectionsSection />
        </div>

        {/* Right Column (Stats, Chart, Achievements) */}
        <div className="xl:col-span-1">
          <StatsSidebar />
        </div>
      </div>
    </div>
  )
}
