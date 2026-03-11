import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, Search, Settings2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.jsx';
import { Badge } from '../ui/badge.jsx';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import { cn } from '../../lib/utils.js';
import { useConfig } from '../../store/useConfig.js';
import { useWordStore } from '../../store/useWordStore.js';
import { useCardStore } from '../../store/useCardStore.js';
import { getDayKey, useProgressStore } from '../../store/useProgressStore.js';
import { isDueToday } from '../../services/srs.js';
import { selectDailyPromptTargets } from '../Builder/practiceModes.js';
import NotificationsPopover from './NotificationsPopover.jsx';
import { BoltIcon, BookIcon, GridIcon, LayersIcon, ReviewIcon, TrendIcon } from './icons.jsx';

const BASE_NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: GridIcon },
  { to: '/reader', label: 'Ler', icon: BookIcon },
  { to: '/practice', label: 'Praticar', icon: BoltIcon },
  { to: '/flashcards', label: 'Revisar', icon: ReviewIcon },
  { to: '/vocabulary', label: 'Vocabulario', icon: LayersIcon },
  { to: '/evolution', label: 'Evolucao', icon: TrendIcon },
];

function SidebarNavItem({ to, label, icon: Icon, badge, onClick }) {
  const IconComponent = Icon;

  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      data-testid={`nav-item-${to === '/' ? 'dashboard' : to.slice(1)}`}
      className={({ isActive }) => cn(
        'group flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm transition-all duration-200',
        isActive
          ? 'bg-white/78 text-sidebar-accent-foreground shadow-[0_12px_28px_rgba(28,20,55,0.08)] ring-1 ring-primary/10 backdrop-blur-xl'
          : 'text-sidebar-foreground hover:bg-white/52 hover:shadow-[0_10px_22px_rgba(28,20,55,0.05)]'
      )}
    >
      {({ isActive }) => (
        <>
          <span className={cn(
            'relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200',
            isActive
              ? 'bg-primary/12 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]'
              : 'bg-black/5 text-neutral-400 group-hover:bg-primary/8 group-hover:text-primary'
          )}>
          <span className={cn(
              'absolute right-2 top-2 h-1.5 w-1.5 rounded-full transition-colors duration-200',
              isActive ? 'bg-primary' : 'bg-neutral-200 group-hover:bg-primary/60'
            )} />
            <IconComponent size={18} strokeWidth={2.1} className="relative z-10" />
          </span>
          <span className={cn('flex-1 whitespace-nowrap text-[0.97rem] font-medium', isActive && 'font-semibold')}>
            {label}
          </span>
          {badge ? (
            <Badge variant="outline" size="sm" className="ml-auto">
              {badge}
            </Badge>
          ) : null}
        </>
      )}
    </NavLink>
  );
}

function SidebarContent({ navItems, onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-transparent">
      <div className="border-b border-black/5 px-6 pb-6 pt-7">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-white shadow-[var(--shadow-btn)]">
            <BoltIcon size={20} strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[1.4rem] font-semibold tracking-[-0.03em] text-foreground">LangFlow</div>
            <div className="max-w-[132px] text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Study loop system
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-3 px-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Loop diario
        </div>

        <nav>
          {navItems.map((item, index) => (
            <div key={item.to} className={cn('relative pt-3', index === 0 && 'pt-0')}>
              {index > 0 ? (
                <div className="pointer-events-none absolute left-4 right-4 top-0 border-t border-dashed border-border/80" />
              ) : null}
              <SidebarNavItem {...item} onClick={onNavigate} />
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-black/5 p-4">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-[22px] border border-white/65 bg-white/62 px-4 py-3 shadow-[0_12px_28px_rgba(28,20,55,0.05)] backdrop-blur-xl transition-all hover:bg-white/84 hover:shadow-[0_16px_34px_rgba(28,20,55,0.08)]"
        >
          <Avatar className="h-11 w-11 rounded-full border border-border">
            <AvatarImage src="https://i.pravatar.cc/100?img=11" alt="Bruno Silva" />
            <AvatarFallback className="rounded-full bg-primary/10 text-primary">BS</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">Bruno Silva</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Configuracoes
            </div>
          </div>
          <Settings2 className="h-4 w-4 text-muted-foreground" />
        </NavLink>
      </div>
    </div>
  );
}

function dispatchPageAction(action) {
  if (typeof window === 'undefined' || !action) return;
  window.dispatchEvent(new CustomEvent('langflow:page-action', {
    detail: { action },
  }));
}

export default function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { config } = useConfig();
  const { words } = useWordStore();
  const { flashcards } = useCardStore();
  const { dailyStats, dailyPromptHistory } = useProgressStore();

  const todayKey = getDayKey();
  const readerCapturedCount = dailyStats[todayKey]?.readerWords || 0;
  const dueReviewsCount = flashcards.filter(isDueToday).length;
  const promptTargets = selectDailyPromptTargets({
    words,
    userLevel: config.userLevel,
    limit: 3,
  });
  const practiceReadyCount = Math.min(
    config.builder?.sessionWordLimit ?? 5,
    words.filter((word) => word.status !== 'dominada').length
  );
  const pendingPrompt = !dailyPromptHistory?.[todayKey] && promptTargets.length > 0;

  const navItems = useMemo(() => BASE_NAV_ITEMS.map((item) => {
    if (item.to === '/reader') {
      return { ...item, badge: readerCapturedCount > 0 ? String(readerCapturedCount) : null };
    }
    if (item.to === '/practice') {
      return {
        ...item,
        badge: pendingPrompt ? 'PROMPT' : practiceReadyCount > 0 ? String(practiceReadyCount) : null,
      };
    }
    if (item.to === '/flashcards') {
      return { ...item, badge: dueReviewsCount > 0 ? String(dueReviewsCount) : null };
    }
    return item;
  }), [dueReviewsCount, pendingPrompt, practiceReadyCount, readerCapturedCount]);

  const pageMeta = useMemo(() => {
    if (location.pathname.startsWith('/reader')) {
      return {
        title: 'Reader',
        kicker: 'Leitura ativa',
        action: { label: 'Importar texto', event: 'reader-primary' },
      };
    }
    if (location.pathname.startsWith('/vocabulary')) {
      return { title: 'Vocabulario', kicker: 'Banco lexical', action: null };
    }
    if (location.pathname.startsWith('/practice')) {
      return {
        title: 'Pratica Rapida',
        kicker: 'Hub de pratica',
        action: { label: 'Continuar sessao', event: 'practice-primary' },
      };
    }
    if (location.pathname.startsWith('/flashcards')) {
      return {
        title: 'Revisao',
        kicker: 'SRS diario',
        action: { label: 'Iniciar revisao', event: 'flashcards-primary' },
      };
    }
    if (location.pathname.startsWith('/evolution')) {
      return { title: 'Evolucao', kicker: 'Panorama completo', action: null };
    }
    if (location.pathname.startsWith('/settings')) {
      return {
        title: 'Configuracoes',
        kicker: 'Preferencias e integracoes',
        action: { label: 'Salvar', event: 'settings-primary' },
      };
    }
    return { title: 'Dashboard', kicker: 'Base de estudo', action: null };
  }, [location.pathname]);

  const isDashboard = location.pathname === '/';

  return (
    <div className="app-shell">
      <aside className="fixed inset-y-0 left-0 z-[60] hidden w-[282px] border-r border-white/50 bg-white/52 backdrop-blur-3xl shadow-[18px_0_44px_rgba(28,20,55,0.06)] transition-all md:block">
        <SidebarContent navItems={navItems} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-neutral-950/35 md:hidden" onClick={() => setMobileOpen(false)} />
      ) : null}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-[60] w-[302px] max-w-[88vw] border-r border-white/50 bg-white/66 backdrop-blur-3xl shadow-[18px_0_44px_rgba(28,20,55,0.08)] transition-transform duration-300 md:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SidebarContent navItems={navItems} onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="md:ml-[282px]">
        {!isDashboard ? (
          <header className="sticky top-0 z-30 border-b border-white/45 bg-white/34">
            <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 backdrop-blur-xl md:px-8 xl:px-10">
              <Button variant="outline" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col">
                  <span className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-primary">
                    {pageMeta.kicker}
                  </span>
                  <h2 className="truncate text-[22px] font-display font-bold text-neutral-950">
                    {pageMeta.title}
                  </h2>
                </div>
              </div>

              <div className="hidden w-full max-w-xs items-center md:flex">
                <div className="relative w-full">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="w-full max-w-sm pl-9" placeholder="Buscar licao..." />
                </div>
              </div>

              {pageMeta.action ? (
                <Button
                  variant="default"
                  size="sm"
                  className="hidden md:inline-flex"
                  data-testid="page-primary-action"
                  onClick={() => dispatchPageAction(pageMeta.action.event)}
                >
                  {pageMeta.action.label}
                </Button>
              ) : null}

              <NotificationsPopover />
            </div>
          </header>
        ) : (
          <div className="sticky top-0 z-30 border-b border-white/45 bg-white/34 px-4 py-3 backdrop-blur-xl md:hidden">
            <div className="mx-auto flex max-w-[1400px] items-center justify-between">
              <Button variant="outline" size="icon" onClick={() => setMobileOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <NotificationsPopover />
            </div>
          </div>
        )}

        <main className="min-h-[calc(100vh-4rem)]">
          <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8 xl:px-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
