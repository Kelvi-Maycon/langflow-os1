import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, BrainCircuit, BookOpen, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/flashcards', label: 'Flashcards', icon: BrainCircuit },
  { path: '/vocabulary', label: 'Vocabulary', icon: BookOpen },
  { path: '/statistics', label: 'Statistics', icon: BarChart3 },
]

function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar variant="inset" className="border-r border-slate-200">
      <SidebarHeader className="p-4 pt-6">
        <div className="flex items-center gap-3 px-2 font-bold text-xl tracking-tight text-slate-900">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          LangFlow
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 mt-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      size="lg"
                      className={cn(
                        'rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
                      )}
                    >
                      <Link to={item.path}>
                        <item.icon className={cn('w-5 h-5 mr-3', isActive ? 'text-primary' : '')} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-4 border-t border-slate-100">
        <Link
          to="/settings"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Avatar className="w-10 h-10 border border-slate-200">
            <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=1" />
            <AvatarFallback>BS</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-sm font-bold text-slate-900 truncate">Bruno Silva</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pro Plan
            </span>
          </div>
          <Settings className="w-4 h-4 text-slate-400 shrink-0" />
        </Link>
      </div>
    </Sidebar>
  )
}

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50/50">
        <AppSidebar />
        <SidebarInset className="bg-transparent flex-1 overflow-hidden flex flex-col min-w-0">
          <header className="h-16 shrink-0 flex items-center px-4 md:px-8 border-b border-slate-100 bg-white md:hidden z-10 shadow-sm">
            <SidebarTrigger className="mr-4" />
            <div className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-primary">
                <BrainCircuit className="w-4 h-4 text-white" />
              </div>
              LangFlow
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 relative">
            <div className="max-w-6xl mx-auto w-full">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
