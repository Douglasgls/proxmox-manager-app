import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUiStore } from '@/stores/uiStore';
import { ROUTES } from '@/utils/constants';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Box,
  Terminal,
  Activity,
  Archive,
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

  const links: SidebarLink[] = [
    { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: 'Containers', path: ROUTES.CONTAINERS, icon: Box },
    { label: 'Jobs', path: ROUTES.JOBS, icon: Terminal },
    { label: 'Monitoring', path: ROUTES.MONITORING, icon: Activity },
    { label: 'Inventory', path: ROUTES.INVENTORY, icon: Archive },
    { label: 'Settings', path: ROUTES.SETTINGS, icon: Settings },
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
        {links.map((link) => (
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
            <link.icon className="size-5 shrink-0" />
            {isSidebarOpen ? (
              <span className="truncate">{link.label}</span>
            ) : (
              <span className="absolute left-14 bg-popover text-popover-foreground text-xs font-semibold px-2 py-1 rounded shadow border border-border scale-0 group-hover:scale-100 transition-all z-50">
                {link.label}
              </span>
            )}
          </NavLink>
        ))}
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
