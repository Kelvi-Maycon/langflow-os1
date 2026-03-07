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
      <header className="md:hidden flex items-center justify-between p-4 bg-sidebar text-sidebar-foreground shrink-0 shadow-soft z-10">
        <div className="flex items-center gap-2 font-bold text-lg">
          <BookOpen className="w-5 h-5 text-sidebar-primary" /> LangFlow
        </div>
        <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
          <RefreshCcw className="w-4 h-4" /> Sincronizado
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground shrink-0 shadow-soft z-10 transition-all">
        <div className="p-6 flex items-center gap-3 font-bold text-xl border-b border-sidebar-border">
          <BookOpen className="w-6 h-6 text-sidebar-primary" />
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
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                    : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80',
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
                {item.path === '/flashcards' && srsCount > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                    {srsCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/50 flex items-center gap-2">
          <RefreshCcw className="w-3 h-3" /> Salvo localmente
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative animate-fade-in">
        {/* Desktop Header area if needed, but keeping it clean */}
        <div className="max-w-4xl mx-auto w-full p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex justify-around p-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center p-2 rounded-lg min-w-[64px] transition-colors relative',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.path === '/flashcards' && srsCount > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
