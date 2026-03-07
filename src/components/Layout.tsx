import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Settings, BookOpen, Hammer, BrainCircuit, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/main'

const navItems = [
  { path: '/', label: 'Painel', icon: LayoutDashboard },
  { path: '/reader', label: 'Leitor', icon: BookOpen },
  { path: '/builder', label: 'Construtor', icon: Hammer },
  { path: '/flashcards', label: 'Revisão', icon: BrainCircuit },
  { path: '/settings', label: 'Config.', icon: Settings },
]

export default function Layout() {
  const location = useLocation()
  const { words } = useStore()
  const srsCount = words.filter((w) => w.status === 'srs' && w.nextReviewDate <= Date.now()).length

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-sidebar text-sidebar-foreground shrink-0 border-b border-white/5 z-10">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <BookOpen className="w-5 h-5 text-primary" /> LangFlow
        </div>
        <div className="flex items-center gap-2 text-xs text-sidebar-foreground/50 bg-white/5 px-3 py-1.5 rounded-full">
          <RefreshCcw className="w-3 h-3" /> Sincronizado
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground shrink-0 border-r border-white/5 z-10 transition-all">
        <div className="p-6 flex items-center gap-3 font-bold text-xl border-b border-white/5 tracking-tight">
          <BookOpen className="w-6 h-6 text-primary" />
          LangFlow
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium border border-primary/20 shadow-inner'
                    : 'hover:bg-white/5 hover:text-foreground text-sidebar-foreground/70',
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform group-hover:scale-110',
                    isActive && 'text-primary',
                  )}
                />
                {item.label}
                {item.path === '/flashcards' && srsCount > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-bold shadow-[0_0_10px_rgba(108,63,197,0.5)]">
                    {srsCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-white/5 text-xs text-sidebar-foreground/40 flex items-center justify-center gap-2">
          <RefreshCcw className="w-3 h-3" /> Salvo localmente
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative animate-fade-in bg-background">
        <div className="max-w-5xl mx-auto w-full p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-white/5 flex justify-around p-2 z-50 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center p-2 rounded-xl min-w-[64px] transition-all relative',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.path === '/flashcards' && srsCount > 0 && (
                <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(108,63,197,0.8)]" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
