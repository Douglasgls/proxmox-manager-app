import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardStore } from '@/stores/dashboardStore';
import {
  Sun,
  Moon,
  Laptop,
  LogOut,
  User as UserIcon,
  Server,
  Clock,
  ChevronDown
} from 'lucide-react';
import { Button } from '../ui/button';
import { inventoryApi } from '@/api/modules/inventoryApi';
import { CloudConnectionCard } from '@/components/cloud/CloudConnectionCard';

// Função auxiliar para formatar o Uptime
const formatUptime = (totalSeconds: number) => {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { metrics, connected } = useDashboard();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu do usuário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca as informações do nó (hostname)
  const { data: host } = useQuery({
    queryKey: ['host', 'inventory'],
    queryFn: inventoryApi.getHost,
    staleTime: Infinity,
  });

  // Atualiza o título da aba do navegador dinamicamente (ex: ProxManager — pve-lab)
  useEffect(() => {
    const name = host?.hostname || (host as any)?.node;
    if (name) {
      document.title = `ProxManager — ${name}`;
    } else {
      document.title = 'ProxManager';
    }
  }, [host]);

  // Busca as métricas (uptime) inicialmente para a store global
  const { data: apiMetrics } = useQuery({
    queryKey: ['host', 'metrics'],
    queryFn: inventoryApi.getHostMetrics,
    refetchInterval: connected ? false : 60000,
  });

  useEffect(() => {
    if (apiMetrics) {
      useDashboardStore.getState().updateMetrics(apiMetrics);
    }
  }, [apiMetrics]);

  return (
    <header className="flex h-14 items-center justify-between px-6 border-b border-white/8 bg-[#101010]/90 backdrop-blur z-30">
      <div className="flex items-center gap-2">
        {/* Espaço reservado para breadcrumb ou vazio */}
      </div>

      {/* Seção Central - Estilo Proxmox Pill */}
      <div className="hidden md:flex items-center justify-center gap-3 px-3 py-1.5 rounded-full border border-white/8 bg-[#171717] text-xs shadow-sm">
        <div className="flex items-center gap-2" title="Nó atual">
          <Server className="size-3.5 text-[#F47732]" />
          <span className="font-mono text-white/50 uppercase">Node</span>
          <span className="font-mono font-semibold text-white">
            {(host?.hostname || (host as any)?.node || 'PVE').toUpperCase()}
          </span>
        </div>

        <div className="h-3 w-px bg-white/10" />

        <div className="flex items-center gap-1.5" title="Tempo de atividade">
          <Clock className="size-3 text-white/40" />
          <span className="font-mono text-white/60 tabular-nums">
            {metrics ? formatUptime(metrics.uptime_seconds) : '--'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 min-w-fit">
        {/* Card de Conexão Cloud */}
        <CloudConnectionCard />

        {/* Informações do Usuário com Dropdown para Logout */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full border border-white/8 bg-[#171717] hover:border-white/20 transition-all focus:outline-none"
              title="Menu do usuário"
            >
              <div className="size-6 rounded-full bg-[#F47732]/20 flex items-center justify-center text-[#F47732] shrink-0">
                <UserIcon className="size-3.5" />
              </div>
              <span className="text-xs font-medium text-white/90 hidden sm:inline max-w-[120px] truncate">
                {user.username || user.email}
              </span>
              <ChevronDown className="size-3 text-white/40" />
            </button>

            {/* Menu Popover */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-[#171717] p-2 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-white/8">
                  <p className="text-xs font-semibold text-white truncate">
                    {user.username || 'Usuário'}
                  </p>
                  <p className="text-[11px] text-white/40 truncate font-mono">
                    {user.email}
                  </p>
                </div>

                {/* Alternador de Tema */}
                <div className="px-3 py-2.5 flex items-center justify-between border-b border-white/8">
                  <span className="text-xs text-white/60">Tema</span>
                  <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
                    <Button
                      variant={theme === 'light' ? 'secondary' : 'ghost'}
                      size="icon-xs"
                      onClick={() => setTheme('light')}
                      className="size-6"
                      title="Tema Claro"
                    >
                      <Sun className="size-3" />
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'secondary' : 'ghost'}
                      size="icon-xs"
                      onClick={() => setTheme('dark')}
                      className="size-6"
                      title="Tema Escuro"
                    >
                      <Moon className="size-3" />
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'secondary' : 'ghost'}
                      size="icon-xs"
                      onClick={() => setTheme('system')}
                      className="size-6"
                      title="Tema do Sistema"
                    >
                      <Laptop className="size-3" />
                    </Button>
                  </div>
                </div>

                {/* Botão de Logout */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                >
                  <LogOut className="size-3.5" />
                  <span>Encerrar Sessão (Sair)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;