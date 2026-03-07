import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Zap,
  BarChart2,
  Trophy,
  MessageSquare,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

const mainNav = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/reader', label: 'Biblioteca', icon: BookOpen },
  { path: '/builder', label: 'Prática Rápida', icon: Zap, badge: 'HOT' },
  { path: '/flashcards', label: 'Estatísticas', icon: BarChart2 },
]

const communityNav = [
  { path: '/ranking', label: 'Ranking', icon: Trophy },
  { path: '/forum', label: 'Fórum', icon: MessageSquare, badge: '3' },
]

function SidebarContent() {
  const location = useLocation()

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] text-sidebar-foreground w-full">
      <div className="p-6 flex items-center gap-3 font-bold text-xl tracking-tight mb-4">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
          <Zap className="w-5 h-5 text-black fill-current" />
        </div>
        LangFlow
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-8">
        <div>
          <h4 className="text-[10px] font-bold text-muted-foreground/50 tracking-widest uppercase mb-3 px-4">
            Menu Principal
          </h4>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group',
                    isActive
                      ? 'bg-white/10 text-foreground font-medium shadow-sm'
                      : 'hover:bg-white/5 text-muted-foreground hover:text-foreground hover:scale-[1.02]',
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 transition-transform group-hover:scale-110',
                      isActive && 'text-white',
                    )}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-pink-500 text-white text-[9px] px-2 py-0.5 rounded-sm font-bold shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-muted-foreground/50 tracking-widest uppercase mb-3 px-4">
            Comunidade
          </h4>
          <nav className="space-y-1">
            {communityNav.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to="#"
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group hover:bg-white/5 text-muted-foreground hover:text-foreground hover:scale-[1.02]"
                >
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-[#2A1A1A] border border-white/10 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 mt-auto">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <Avatar className="w-10 h-10 border-2 border-white/10">
            <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1" />
            <AvatarFallback>BS</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground leading-tight">Bruno Silva</span>
            <span className="text-[10px] font-bold text-muted-foreground tracking-wider">
              PLANO PRO
            </span>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#0A0A0A] border-b border-white/5 z-10 shrink-0">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-white">
          <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
            <Zap className="w-4 h-4 text-black fill-current" />
          </div>
          LangFlow
        </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button className="p-2 text-muted-foreground hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-[#0A0A0A] border-r-white/10 w-[280px]">
            <SheetTitle className="sr-only">Menu Principal</SheetTitle>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] shrink-0 border-r border-white/5 z-10">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-[#0A0A0A]">
        <div className="max-w-[1400px] mx-auto w-full p-4 md:p-8 lg:px-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
