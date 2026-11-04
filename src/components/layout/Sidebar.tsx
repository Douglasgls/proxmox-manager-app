import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUiStore } from '@/stores/uiStore';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import { ROUTES } from '@/utils/constants';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Box,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Server,
} from 'lucide-react';
import { Button } from '../ui/button';

interface SidebarLink {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC = () => {
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const { isNotConfigured } = useAgentStatus();

  const mainLinks: SidebarLink[] = [
    { label: 'Visão geral', path: ROUTES.DASHBOARD, icon: LayoutGrid },
    { label: 'Containers', path: ROUTES.CONTAINERS, icon: Box },
    { label: 'Nós', path: ROUTES.MONITORING, icon: Server },
    { label: 'Atividade do agente', path: ROUTES.JOBS, icon: Activity },
  ];

  const settingsLink: SidebarLink = {
    label: 'Configurações',
    path: ROUTES.SETTINGS,
    icon: Settings,
  };

  const renderLink = (link: SidebarLink) => {
    const isConfigs = link.path === ROUTES.SETTINGS;
    const isLocked = isNotConfigured && !isConfigs;
    const showWarning = isConfigs && isNotConfigured;
    const isDashboard = link.path === ROUTES.DASHBOARD;

    if (isLocked) {
      return (
        <div
          key={link.path}
          className={cn(
            'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group relative',
            'opacity-40 cursor-not-allowed select-none text-muted-foreground hover:bg-transparent'
          )}
          title="Bloqueado: Requer configuração do Proxmox VE"
        >
          <div className="relative shrink-0">
            <link.icon className={cn('size-5 shrink-0', isDashboard && 'text-[#F47732]')} />
          </div>

          {isSidebarOpen ? (
            <>
              <span className="truncate flex-1">{link.label}</span>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                Bloqueado
              </span>
            </>
          ) : (
            <span className="absolute left-14 bg-popover text-popover-foreground text-xs font-semibold px-2 py-1 rounded shadow border border-border scale-0 group-hover:scale-100 transition-all z-50 flex items-center gap-1.5 whitespace-nowrap">
              {link.label} (Bloqueado)
            </span>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={link.path}
        to={link.path}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group relative',
            isActive
              ? 'bg-[#292929] text-white font-medium'
              : 'text-white/60 hover:bg-white/5 hover:text-white'
          )
        }
      >
        <div className="relative shrink-0">
          <link.icon
            className={cn(
              'size-5 shrink-0 transition-colors',
              isDashboard ? 'text-[#F47732]' : ''
            )}
          />
          {showWarning && !isSidebarOpen && (
            <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-amber-500 ring-2 ring-card animate-pulse" />
          )}
        </div>

        {isSidebarOpen ? (
          <>
            <span className="truncate flex-1">{link.label}</span>
            {showWarning && (
              <span
                className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0"
                title="Configuração pendente"
              />
            )}
          </>
        ) : (
          <span className="absolute left-14 bg-popover text-popover-foreground text-xs font-semibold px-2 py-1 rounded shadow border border-border scale-0 group-hover:scale-100 transition-all z-50 flex items-center gap-1.5 whitespace-nowrap">
            {link.label}
            {showWarning && <span className="size-2 rounded-full bg-amber-500 animate-pulse" />}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        'relative z-20 flex flex-col h-screen border-r border-white/8 bg-[#131313] transition-all duration-300 ease-in-out',
        isSidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Header / Logo */}
      <div className="flex h-16 items-center px-4 border-b border-white/8">
        <NavLink
          to={ROUTES.DASHBOARD}
          className="flex items-center gap-2 overflow-hidden focus:outline-none"
          title="ProxManager"
        >
          {isSidebarOpen ? (
            <>
              <img
                src="/logoPMTCC/proxmanager-logo-on-dark.svg"
                alt="ProxManager"
                className="h-7 w-auto hidden dark:block"
              />
              <img
                src="/logoPMTCC/proxmanager-logo-on-light.svg"
                alt="ProxManager"
                className="h-7 w-auto dark:hidden"
              />
            </>
          ) : (
            <img
              src="/logoPMTCC/proxmanager-symbol.svg"
              alt="ProxManager"
              className="size-7 shrink-0 mx-auto"
            />
          )}
        </NavLink>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {mainLinks.map((link) => renderLink(link))}
      </nav>

      {/* Configurações no final lá em baixo */}
      <div className="p-2 border-t border-border mt-auto">
        {renderLink(settingsLink)}
      </div>

      {/* Botão de Toggle da Barra Lateral */}
      <div className="p-2 border-t border-border flex justify-end">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-foreground"
        >
          {isSidebarOpen ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
        </Button>
      </div>
    </aside>
  );
};
export default Sidebar;
