import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUiStore } from '@/stores/uiStore';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import { ROUTES } from '@/utils/constants';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Box,
  Terminal,
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

  const links: SidebarLink[] = [
    { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: 'Containers', path: ROUTES.CONTAINERS, icon: Box },
    { label: 'Monitoring', path: ROUTES.MONITORING, icon: Activity },
    { label: 'Jobs', path: ROUTES.JOBS, icon: Terminal },
    { label: 'Configs', path: ROUTES.SETTINGS, icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'relative z-20 flex flex-col h-screen border-r border-border bg-card transition-all duration-300 ease-in-out',
        isSidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Header / Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2 overflow-hidden font-bold">
          <Server className="size-6 text-primary shrink-0 animate-pulse" />
          {isSidebarOpen && <span className="truncate text-foreground text-sm font-bold uppercase tracking-wider">Proxmox Mgr</span>}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {links.map((link) => {
          const isConfigs = link.path === ROUTES.SETTINGS;
          const isLocked = isNotConfigured && !isConfigs;
          const showWarning = isConfigs && isNotConfigured;

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
                  <link.icon className="size-5 shrink-0" />
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
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <div className="relative shrink-0">
                <link.icon className="size-5 shrink-0" />
                {showWarning && !isSidebarOpen && (
                  <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-amber-500 ring-2 ring-card animate-pulse" />
                )}
              </div>

              {isSidebarOpen ? (
                <>
                  <span className="truncate flex-1">{link.label}</span>
                  {showWarning && (
                    <span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" title="Configuração pendente" />
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
        })}
      </nav>

      {/* Sidebar Footer toggle */}
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
