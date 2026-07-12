import React, { useState, useEffect } from 'react';
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
  RefreshCw 
} from 'lucide-react';
import { Button } from '../ui/button';
import { inventoryApi } from '@/api/modules/inventoryApi';

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
  const [isSyncing, setIsSyncing] = useState(false);

  // Busca as informações do nó (hostname)
  const { data: host } = useQuery({
    queryKey: ['host', 'inventory'],
    queryFn: inventoryApi.getHost,
    staleTime: Infinity, // O hostname raramente muda, não precisa fazer refetch automático
  });

  // Busca as métricas (uptime) inicialmente para a store global
  const { data: apiMetrics } = useQuery({
    queryKey: ['host', 'metrics'],
    queryFn: inventoryApi.getHostMetrics,
    refetchInterval: connected ? false : 60000, // Atualiza sozinho a cada 1 minuto apenas se não conectado via WS
  });

  useEffect(() => {
    if (apiMetrics) {
      useDashboardStore.getState().updateMetrics(apiMetrics);
    }
  }, [apiMetrics]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const data = await inventoryApi.getHostMetrics();
      useDashboardStore.getState().updateMetrics(data);
    } catch (err) {
      console.error('[Header] Sync failed', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between px-6 border-b border-border bg-card">
      <div className="flex items-center gap-4 w-1/4">
        {/* Espaço para Breadcrumb ou Título Dinâmico */}
        <span className="text-sm font-semibold text-muted-foreground">Plataforma</span>
      </div>

      {/* Seção Central - Estilo Proxmox */}
      <div className="hidden md:flex items-center gap-4 px-4 py-1.5 rounded-md border border-border bg-muted/30 shadow-sm">
        
        {/* Node Name */}
        <div className="flex items-center gap-2" title="Nó atual">
          <Server className="size-4 text-primary" />
          <p>Node</p>
          <span className="text-sm font-medium text-foreground">
            {host?.hostname.toUpperCase()}
          </span>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Uptime */}
        <div className="flex items-center gap-2" title="Tempo de atividade">
          <Clock className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground tabular-nums">
            {metrics ? formatUptime(metrics.uptime_seconds) : '--'}
          </span>
        </div>

        {/* <div className="h-4 w-px bg-border" /> */}

        {/* Botão de Sync Melhorado */}
        {/* <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          className="h-7 px-2.5 gap-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all rounded-full"
          title="Sincronizar dados do nó"
        >
          <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
          <span className="text-xs font-medium uppercase tracking-wider">
            {isSyncing ? 'Sincronizando...' : 'Sync'}
          </span>
        </Button> */}
      </div>

      <div className="flex items-center justify-end gap-4 w-1/4">
        {/* Toggle de Tema */}
        <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
          <Button
            variant={theme === 'light' ? 'secondary' : 'ghost'}
            size="icon-xs"
            onClick={() => setTheme('light')}
            className="size-7"
            title="Tema Claro"
          >
            <Sun className="size-3.5" />
          </Button>
          <Button
            variant={theme === 'dark' ? 'secondary' : 'ghost'}
            size="icon-xs"
            onClick={() => setTheme('dark')}
            className="size-7"
            title="Tema Escuro"
          >
            <Moon className="size-3.5" />
          </Button>
          <Button
            variant={theme === 'system' ? 'secondary' : 'ghost'}
            size="icon-xs"
            onClick={() => setTheme('system')}
            className="size-7"
            title="Tema do Sistema"
          >
            <Laptop className="size-3.5" />
          </Button>
        </div>

        {/* Divisor */}
        <div className="h-6 w-px bg-border" />

        {/* Informações do Usuário */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-sm font-semibold text-foreground">{user.name}</span>
              <span className="text-xs text-muted-foreground uppercase">{user.role}</span>
            </div>
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UserIcon className="size-4" />
            </div>
            <Button
              variant="destructive"
              size="icon-sm"
              onClick={logout}
              title="Sair"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;