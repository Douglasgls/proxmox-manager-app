import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import ErrorAlert from '@/components/common/Error';
import Loading from '@/components/common/Loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { inventoryApi } from '@/api/modules/inventoryApi';
import { formatBytes } from '@/utils/bytes';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useDashboardMetrics } from '@/hooks/websocket/useDashboardMetrics';
import {
  Activity, Clock,
  ArrowDownToLine, ArrowUpFromLine, 
  PlayCircle, StopCircle, 
  PauseCircle, Box, 
  Disc, FileCode2,
  XCircle, Network,
  Database, CheckCircle2,
  ShieldAlert, KeyRound, Settings, RefreshCw,
} from 'lucide-react';

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
  const navigate = useNavigate();
  const { metrics } = useDashboard();
  const { data: wsMetrics, loading: isMetricsPending } = useDashboardMetrics();

  const {
    data: host,
    isPending: isHostPending,
    isError: isHostError,
    error: hostError,
    refetch: refetchHost,
  } = useQuery({
    queryKey: ['host', 'inventory'],
    queryFn: inventoryApi.getHost,
    staleTime: Infinity, 
  });

  const { data: storages } = useQuery({
    queryKey: ['storages'],
    queryFn: () => inventoryApi.getStorages(),
  });

  const { data: networks } = useQuery({
    queryKey: ["networks"],
    queryFn: inventoryApi.getNetworks,
  });

  // Ordenação das Interfaces de Rede:
  // 1º: Ativas com IP atribuído
  // 2º: Ativas sem IP
  // 3º: Inativas
  const sortedInterfaces = useMemo(() => {
    if (!networks?.interfaces) return [];

    return [...networks.interfaces].sort((a, b) => {
      const getRank = (net: typeof a) => {
        const hasIp = Boolean(net.address && net.address.trim() !== '' && net.address !== 'Não atribuído');
        if (net.active && hasIp) return 1;
        if (net.active && !hasIp) return 2;
        return 3;
      };

      const rankA = getRank(a);
      const rankB = getRank(b);

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      return (a.name || a.iface || '').localeCompare(b.name || b.iface || '');
    });
  }, [networks]);

  useEffect(() => {
    if (wsMetrics) {
      useDashboardStore.getState().updateMetrics(wsMetrics);
    }
  }, [wsMetrics]);

  const isPending = isHostPending || (isMetricsPending && !metrics.lastUpdate);
  const isError = isHostError;

  if (isPending) {
    return <Loading message="Carregando dados do host..." />;
  }

  if (isError || !host || !metrics.lastUpdate) {
    const errData = (hostError as any)?.response?.data;
    const isPermission =
      (hostError as any)?.response?.status === 403 ||
      errData?.error_code === 'PROXMOX_PERMISSION_DENIED';

    if (isPermission) {
      return (
        <div className="max-w-3xl mx-auto my-8 p-6 md:p-8 rounded-2xl border border-amber-500/30 bg-card shadow-lg text-foreground space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="size-8" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-foreground">Permissão Insuficiente no Proxmox VE</h3>
                <Badge variant="warning" className="text-xs">403 Forbidden</Badge>
                {errData?.required_permission && (
                  <Badge variant="outline" className="font-mono text-xs border-amber-500/40">
                    {errData.required_permission}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {errData?.detail ||
                  "O Proxmox VE negou acesso à leitura de status do nó por falta de permissão 'Sys.Audit'."}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-muted/30 space-y-3.5 text-xs leading-relaxed">
            <p className="font-semibold text-foreground flex items-center gap-2 text-sm">
              <KeyRound className="size-4 text-amber-500" />
              Como liberar essa permissão no Proxmox VE:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground pl-1 text-xs">
              <li>Acesse o Proxmox VE &gt; <strong>Datacenter</strong> &gt; aba <strong>Permissions</strong>.</li>
              <li>Clique no botão <strong>Add</strong> &gt; selecione <strong>API Token Permission</strong> (ou <em>User Permission</em>).</li>
              <li>Defina o campo <strong>Path</strong> como <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground font-semibold">{errData?.path || '/nodes/pve'}</code> (ou <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground font-semibold">/</code>).</li>
              <li>Atribua a Role <strong className="text-foreground font-semibold">PVEAuditor</strong> (ou <em>Administrator</em>) ao token.</li>
              <li>Marque a opção <strong>Propagate</strong> (Propagar) e clique em <strong>Add</strong>.</li>
            </ol>
            <p className="text-[11px] text-muted-foreground pt-2 border-t border-border/50">
              * Dica: Se o seu API Token foi criado com a opção <em>Privilege Separation</em> ativada, a permissão deve ser concedida especificamente para o Token para surtir efeito.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => refetchHost()} className="gap-2">
              <RefreshCw className="size-3.5" />
              Tentar Novamente
            </Button>
            <Button size="sm" onClick={() => navigate('/app/settings')} className="gap-2">
              <Settings className="size-3.5" />
              Ir para Configurações
            </Button>
          </div>
        </div>
      );
    }

    return <ErrorAlert title="Não foi possível carregar os dados" onRetry={() => { refetchHost(); }} />;
  }

  const ramPercent = host.memory_total_bytes > 0 ? (metrics.memory_used_bytes / host.memory_total_bytes) * 100 : 0;
  const swapPercent = host.swap_total_bytes > 0 ? (metrics.swap_used_bytes / host.swap_total_bytes) * 100 : 0;
  
  const diskTotal = metrics.disk_used_bytes + metrics.disk_free_bytes;
  const diskPercent = diskTotal > 0 ? (metrics.disk_used_bytes / diskTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Host / Overview"
        description={`Visão geral e monitoramento do nó ${host.hostname.toUpperCase()}.`}
      />

      {/* PARA MAIS DADOS */}
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
        <span className="font-medium text-muted-foreground">Para mais dados acesse:</span>
        
        <div className="flex flex-wrap gap-3">
          {networks?.interfaces
            ?.filter((network) => network.address && network.address !== '127.0.0.1')
            .map((network, index) => (
              <a
                key={index}
                href={`https://${network.address}:8006`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary hover:underline hover:text-primary/80 transition-colors"
              >
                https://{network.address}:8006
              </a>
            ))}
            
            {!networks && <span className="text-muted-foreground animate-pulse">Carregando IPs...</span>}
        </div>
      </div>

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
          </CardContent>
        </Card>

        {/* Rede, Load e Contêineres */}
        <div className="flex flex-col gap-6">
          {/* CARD DE REDE E SISTEMA */}
          <Card>
            <CardHeader>
              <CardTitle>Rede e Sistema</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              
              <div className="flex flex-col gap-1 border-l-2 border-primary/50 pl-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Clock className="size-3.5" /> Uptime
                </span>
                <span className="font-semibold text-foreground">{formatUptime(metrics.uptime_seconds)}</span>
              </div>

              <div className="flex flex-col gap-1 border-l-2 border-primary/50 pl-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Activity className="size-3.5" /> Load Average
                </span>
                <span className="font-semibold text-foreground">{metrics.load_average.join(', ')}</span>
              </div>

              <div className="flex flex-col gap-1 border-l-2 border-emerald-500 pl-3 mt-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <ArrowDownToLine className="size-3.5 text-emerald-500" /> Tráfego (RX)
                </span>
                <span className="font-semibold text-foreground">{formatBytes(metrics.rx_bytes)}</span>
              </div>

              <div className="flex flex-col gap-1 border-l-2 border-primary pl-3 mt-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <ArrowUpFromLine className="size-3.5 text-primary" /> Tráfego (TX)
                </span>
                <span className="font-semibold text-foreground">{formatBytes(metrics.tx_bytes)}</span>
              </div>

            </CardContent>
          </Card>

          {/* CARD DE CONTÊINERES (LXC) */}
          <Card>
            <CardHeader>
              <CardTitle>Inventário de Contêineres (LXC)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              
              {/* Total */}
              <div className="flex flex-col rounded-lg border border-border bg-muted/40 p-3">
                <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Total</span>
                <div className="flex items-center gap-2 font-bold text-lg text-foreground mt-auto">
                  <Box className="size-4 text-primary" />
                  {host.containers_total}
                </div>
              </div>

              {/* Em Execução (Verde) */}
              <div className="flex flex-col rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 mb-1 uppercase tracking-wider font-medium">Em Execução</span>
                <div className="flex items-center gap-2 font-bold text-lg text-emerald-700 dark:text-emerald-400 mt-auto">
                  <PlayCircle className="size-4" />
                  {host.containers_running}
                </div>
              </div>

              {/* Parados (Vermelho) */}
              <div className="flex flex-col rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <span className="text-xs text-destructive mb-1 uppercase tracking-wider font-medium">Parados</span>
                <div className="flex items-center gap-2 font-bold text-lg text-destructive mt-auto">
                  <StopCircle className="size-4" />
                  {host.containers_stopped}
                </div>
              </div>

              {/* Suspensos (Laranja/Amarelo) */}
              <div className="flex flex-col rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <span className="text-xs text-amber-700 dark:text-amber-400 mb-1 uppercase tracking-wider font-medium">Suspensos</span>
                <div className="flex items-center gap-2 font-bold text-lg text-amber-700 dark:text-amber-400 mt-auto">
                  <PauseCircle className="size-4" />
                  {host.containers_suspended}
                </div>
              </div>

              {/* Templates (Azul Mudo) */}
              <div className="flex flex-col rounded-lg border border-border bg-muted/20 p-3">
                <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Templates</span>
                <div className="flex items-center gap-2 font-bold text-lg text-foreground mt-auto">
                  <FileCode2 className="size-4 text-muted-foreground" />
                  {host.template_count}
                </div>
              </div>

              {/* ISOs (Roxo/Neutro) */}
              <div className="flex flex-col rounded-lg border border-border bg-muted/20 p-3">
                <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">Imagens ISO</span>
                <div className="flex items-center gap-2 font-bold text-lg text-foreground mt-auto">
                  <Disc className="size-4 text-muted-foreground" />
                  {host.iso_count}
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

      {/* SESSÃO STORAGE E NETWORK */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* === STORAGES === */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Armazenamento (Storages)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {storages?.map((storage) => (
              <div
                key={storage.name}
                className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:bg-muted/30 hover:shadow-md"
              >
                {/* Cabeçalho do Card */}
                <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2 text-foreground min-w-0">
                    <Database className="size-4 shrink-0 text-primary" />
                    <h3 className="font-semibold tracking-tight truncate">{storage.name}</h3>
                  </div>
                  
                  {/* Badge de Status */}
                  <div 
                    className={`shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${
                      storage.active 
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'border-destructive/20 bg-destructive/10 text-destructive'
                    }`}
                  >
                    {storage.active ? (
                      <><CheckCircle2 className="size-3" /> Ativo</>
                    ) : (
                      <><XCircle className="size-3" /> Inativo</>
                    )}
                  </div>
                </div>

                {/* Informações (Layout Key-Value) */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipo</span>
                    <span className="font-medium uppercase">{storage.storage_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Capacidade</span>
                    <span className="font-medium">{formatBytes(storage.total_bytes || storage.total || 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* === INTERFACES DE REDE === */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Interfaces de Rede</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {sortedInterfaces.map((network) => (
              <div
                key={network.name}
                className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:bg-muted/30 hover:shadow-md"
              >
                {/* Cabeçalho do Card */}
                <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2 text-foreground min-w-0">
                    <Network className="size-4 shrink-0 text-primary" />
                    <h3 className="font-semibold tracking-tight truncate">{network.name}</h3>
                  </div>

                  {/* Badge de Status */}
                  <div 
                    className={`shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider border ${
                      network.active 
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'border-destructive/20 bg-destructive/10 text-destructive'
                    }`}
                  >
                    {network.active ? (
                      <><CheckCircle2 className="size-3" /> Ativa</>
                    ) : (
                      <><XCircle className="size-3" /> Inativa</>
                    )}
                  </div>
                </div>

                {/* Informações (Layout Key-Value) */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipo</span>
                    <span className="font-medium uppercase">{network.interface_type}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">IP</span>
                    <span className="font-mono text-xs font-medium text-foreground">{network.address ?? "Não atribuído"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Máscara</span>
                    <span className="font-mono text-xs text-muted-foreground">{network.netmask ?? "-"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Gateway</span>
                    <span className="font-mono text-xs text-muted-foreground">{network.gateway ?? "-"}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default Dashboard;
