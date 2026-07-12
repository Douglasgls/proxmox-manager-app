import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import Error from '@/components/common/Error';
import Loading from '@/components/common/Loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { inventoryApi } from '@/api/modules/inventoryApi';
import { formatBytes } from '@/utils/bytes';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardStore } from '@/stores/dashboardStore';

// Função auxiliar para formatar o Uptime
const formatUptime = (totalSeconds: number) => {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

// Componente visual para as Barras de Progresso de Métricas
const MetricBar: React.FC<{ label: string; percent: number; valueText: string; colorClass?: string }> = ({ 
  label, 
  percent, 
  valueText, 
  colorClass = "bg-primary" 
}) => {
  // Garante que a barra não passe de 100% visualmente
  const safePercent = Math.min(Math.max(percent, 0), 100);
  
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{valueText} ({safePercent.toFixed(1)}%)</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div 
          className={`h-full transition-all duration-500 ease-in-out ${colorClass}`} 
          style={{ width: `${safePercent}%` }} 
        />
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { metrics, connected } = useDashboard();

  const { data: host, isPending: isHostPending, isError: isHostError, refetch: refetchHost } = useQuery({
    queryKey: ['host', 'inventory'],
    queryFn: inventoryApi.getHost,
    staleTime: Infinity, // Dados de inventário não mudam com frequência
  });

  const { data: apiMetrics, isPending: isMetricsPending, isError: isMetricsError, refetch: refetchMetrics } = useQuery({
    queryKey: ['host', 'metrics'],
    queryFn: inventoryApi.getHostMetrics,
    refetchInterval: connected ? false : 5000, // Atualiza a cada 5 segundos apenas se não estiver conectado via WS
  });

  useEffect(() => {
    if (apiMetrics) {
      useDashboardStore.getState().updateMetrics(apiMetrics);
    }
  }, [apiMetrics]);

  const isPending = isHostPending || (isMetricsPending && !metrics.lastUpdate);
  const isError = isHostError || (isMetricsError && !metrics.lastUpdate);

  if (isPending) {
    return <Loading message="Carregando dados do host..." />;
  }

  if (isError || !host || !metrics.lastUpdate) {
    return <Error title="Não foi possível carregar os dados" onRetry={() => { refetchHost(); refetchMetrics(); }} />;
  }

  // Cálculos de porcentagem para as barras gráficas
  const ramPercent = host.memory_total_bytes > 0 ? (metrics.memory_used_bytes / host.memory_total_bytes) * 100 : 0;
  const swapPercent = host.swap_total_bytes > 0 ? (metrics.swap_used_bytes / host.swap_total_bytes) * 100 : 0;
  
  // O disco total é a soma do usado + livre
  const diskTotal = metrics.disk_used_bytes + metrics.disk_free_bytes;
  const diskPercent = diskTotal > 0 ? (metrics.disk_used_bytes / diskTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Host / Overview"
        description={`Visão geral e monitoramento do nó ${host.hostname.toUpperCase()}.`}
      />

      {/* 1. SEÇÃO ESTÁTICA (Hardware e SO) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Processador</p>
            <p className="font-medium text-foreground" title={host.cpu_model}>{host.cpu_model}</p>
            <p className="text-sm text-muted-foreground mt-1">{host.cpu_cores} Cores / {host.cpu_threads} Threads</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Memória Física</p>
            <p className="font-medium text-foreground">{formatBytes(host.memory_total_bytes)} RAM</p>
            <p className="text-sm text-muted-foreground mt-1">{formatBytes(host.swap_total_bytes)} Swap</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Kernel Linux</p>
            {/* Pega apenas a parte principal do kernel para não quebrar o layout */}
            <p className="font-medium text-foreground truncate" title={host.kernel_version}>
              {host.kernel_version.split(' ')[1] || host.kernel_version}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{host.architecture ?? 'amd64'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Proxmox VE</p>
            <p className="font-medium text-foreground truncate">{host.proxmox_version.split('/')[1] || host.proxmox_version}</p>
            <p className="text-sm text-muted-foreground mt-1">Versão do Manager</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. SEÇÃO DINÂMICA (Métricas e Inventário Lógico) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Gráficos em Barra das Métricas */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Métricas de Uso (Tempo Real)</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-6 justify-center">
            <MetricBar 
              label="Uso de CPU" 
              percent={metrics.cpu_usage_percent} 
              valueText={`${metrics.cpu_usage_percent.toFixed(1)}%`}
              colorClass={metrics.cpu_usage_percent > 85 ? "bg-destructive" : "bg-primary"}
            />
            <MetricBar 
              label="Uso de RAM" 
              percent={ramPercent} 
              valueText={`${formatBytes(metrics.memory_used_bytes)} / ${formatBytes(host.memory_total_bytes)}`} 
              colorClass={ramPercent > 85 ? "bg-destructive" : "bg-primary"}
            />
            <MetricBar 
              label="Uso de Swap" 
              percent={swapPercent} 
              valueText={`${formatBytes(metrics.swap_used_bytes)} / ${formatBytes(host.swap_total_bytes)}`} 
              colorClass="bg-amber-500"
            />
            <MetricBar 
              label="Uso de Disco (Root)" 
              percent={diskPercent} 
              valueText={`${formatBytes(metrics.disk_used_bytes)} / ${formatBytes(diskTotal)}`} 
            />
            
            {/* Dica para o TCC: Se você instalar a biblioteca 'recharts', você pode substituir as barras por um <LineChart> aqui! */}
          </CardContent>
        </Card>

        {/* Rede, Load e Contêineres */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Rede e Sistema</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Detail label="Uptime" value={formatUptime(metrics.uptime_seconds)} />
              <Detail label="Load Average" value={metrics.load_average.join(', ')} />
              <Detail label="Tráfego Recebido (RX)" value={formatBytes(metrics.rx_bytes)} />
              <Detail label="Tráfego Enviado (TX)" value={formatBytes(metrics.tx_bytes)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instâncias e Imagens</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              <Detail label="LXC" value={metrics.containers_total} />
              <Detail label="Rodando" value={metrics.containers_running} />
              <Detail label="Parados" value={metrics.containers_stopped} />
              <Detail label="Templates" value={host.template_count} />
              <Detail label="Imagens ISO" value={host.iso_count} />
              <Detail label="Suspensos" value={host.containers_suspended} />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

// Componente auxiliar de texto (mantido o seu original)
const Detail: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-1 break-words font-medium text-foreground">{value}</p>
  </div>
);

export default Dashboard;