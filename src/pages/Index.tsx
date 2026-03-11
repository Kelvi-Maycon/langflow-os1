import { Search, Flame, Bell } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { HeroWelcome } from '@/components/dashboard/HeroWelcome'
import { MissionsToday } from '@/components/dashboard/MissionsToday'
import { ProgressionRoadmap } from '@/components/dashboard/ProgressionRoadmap'
import { StatsSidebar } from '@/components/dashboard/StatsSidebar'
import { CollectionsSection } from '@/components/dashboard/CollectionsSection'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Index() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate('/reader')
      setSearchValue('')
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Bar Area */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Olá, Aprendiz!</h1>
          <p className="text-xs font-bold tracking-widest text-muted-foreground mt-1 uppercase">
            Sua central de estudos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64 hidden lg:block group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            <Input
              placeholder="Buscar ou capturar..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearch}
              className="pl-9 bg-background border-border rounded-full h-10 text-sm shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-300 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
          </div>

          <button
            onClick={() => navigate('/practice')}
            className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full text-orange-600 font-bold text-sm shadow-sm hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            <Flame className="w-4 h-4 fill-current text-orange-500" />
            Praticar
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary hover:shadow-sm transition-all duration-300 active:scale-95 relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-pink-500 border-2 border-card" />
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
