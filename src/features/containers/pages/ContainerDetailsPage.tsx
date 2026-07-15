import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useContainerInventoryById,
  useStartContainer,
  useStopContainer,
  useRestartContainer,
  useDeleteContainer
} from '../hooks';
import { useContainerMetrics } from '@/hooks/websocket/useContainerMetrics';
import PageHeader from '@/components/common/PageHeader';
import Loading from '@/components/common/Loading';
import Error from '@/components/common/Error';
import StatusBadge from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/utils/bytes';
import { formatPercentage } from '@/utils/number';
import { formatUptime } from '@/utils/date';
import { ProgressBar } from '@/components/common/ProgressBar';
import {
  ArrowLeft, Cpu, HardDrive, Database, Activity,
  ArrowDownToLine, ArrowUpFromLine, Binary, Clock,
  RefreshCw, Info, FileInput, FileOutput,
  Loader2, Globe
} from 'lucide-react';

export const ContainerDetailsPage: React.FC = () => {
  const { containerId } = useParams<{ containerId: string }>();
  const id = containerId || '';

  const {
    data: inventory,
    isPending: isInventoryPending,
    isError: isInventoryError,
    refetch: refetchInventory,
  } = useContainerInventoryById(id);

  const {
    data: metrics,
    loading: isMetricsPending,
  } = useContainerMetrics(inventory?.container_id);

  const startMutation = useStartContainer();
  const stopMutation = useStopContainer();
  const restartMutation = useRestartContainer();
  const deleteMutation = useDeleteContainer();

  const isLoading = isInventoryPending || (isMetricsPending && !metrics);
  const isError = isInventoryError;

  const isStarting = startMutation.isPending && startMutation.variables === inventory?.id;
  const isStopping = stopMutation.isPending && stopMutation.variables === inventory?.id;
  const isRestarting = restartMutation.isPending && restartMutation.variables === inventory?.id;
  const isAnyActionPending = isStarting || isStopping || isRestarting;
  const isDeleting = deleteMutation.isPending && deleteMutation.variables === inventory?.id;

  const handleRefresh = () => {
    refetchInventory();
  };

  if (isLoading && !inventory) {
    return <Loading message="Buscando detalhes do container..." />;
  }

  if (isError || !inventory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link to="/app/containers">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="size-4" />
              Voltar
            </Button>
          </Link>
        </div>
        <Error
          title="Erro ao carregar detalhes"
          message={`Não foi possível carregar os dados para o container ID: ${id}`}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  // Helper status for StatusBadge
  const getContainerStatus = () => {
    if (inventory.locked || inventory.lock) return 'locked';
    if (inventory.status === 'suspended') return 'suspended';
    return inventory.status || 'unknown';
  };

  const isRunning = inventory.status?.toLowerCase() === 'running';
  const isLocked = !!(inventory.locked || inventory.lock);

  return (
    <div className="space-y-6">
      {/* Top navigation & action bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link to="/app/containers">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="size-4" />
            Voltar para listagem
          </Button>
        </Link>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            Sincronizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isRunning || isLocked || isAnyActionPending}
            onClick={() => startMutation.mutate(inventory?.id || '')}
            className="gap-1.5"
          >
            {isStarting && <Loader2 className="size-4 animate-spin text-primary" />}
            Start
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!isRunning || isLocked || isAnyActionPending}
            onClick={() => stopMutation.mutate(inventory?.id || '')}
            className="text-red-500 hover:text-red-600 gap-1.5"
          >
            {isStopping && <Loader2 className="size-4 animate-spin text-red-500" />}
            Stop
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!isRunning || isLocked || isAnyActionPending}
            onClick={() => restartMutation.mutate(inventory?.id || '')}
            className="gap-1.5"
          >
            {isRestarting && <Loader2 className="size-4 animate-spin text-primary" />}
            Restart
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isRunning || isLocked || isAnyActionPending}
            onClick={() => deleteMutation.mutate(inventory?.id || '')}
            className="text-red-500 hover:text-red-600 gap-1.5"
          >
            {isDeleting && <Loader2 className="size-4 animate-spin text-red-500" />}
            Delete
          </Button>
          {!isRunning || isLocked || isAnyActionPending ? (
            <Button variant="outline" size="sm" disabled>
              Console
            </Button>
          ) : (
            <Link to={`/app/containers/${inventory?.id}/console`}>
              <Button variant="outline" size="sm">
                Console
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Page Header */}
      <PageHeader
        title={`Container: ${inventory.name}`}
        description={`Gerenciamento detalhado do container LXC #${inventory.container_id}.`}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">Status atual:</span>
            <StatusBadge type="container" status={getContainerStatus()} />
          </div>
        }
      />

      {/* Grid containing Core Info & Resource Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Core Info Card */}
        <Card className="md:col-span-1 border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <Info className="size-4 text-primary" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">ID do Container (VMID)</span>
              <span className="text-sm font-semibold">{inventory.container_id}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">ID único (UUID)</span>
              <span className="text-xs font-mono font-semibold max-w-[170px] truncate select-all" title={inventory.id}>{inventory.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Nome</span>
              <span className="text-sm font-semibold">{inventory.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Status do Cluster</span>
              <span className="text-sm font-semibold capitalize">{inventory.status}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Cores de CPU</span>
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Binary className="size-3.5 text-muted-foreground" />
                {inventory.cpu_cores}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Uptime</span>
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                {metrics ? formatUptime(metrics.uptime_seconds) : '0s'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Bloqueado (Lock)</span>
              <span className="text-sm font-semibold">
                {isLocked ? (
                  <span className="text-orange-500 font-medium">{inventory.lock || 'Sim'}</span>
                ) : (
                  'Não'
                )}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">Endereço IP</span>
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Globe className="size-3.5 text-muted-foreground" />
                {inventory.ip_address || '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Resource Usage Grid */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* CPU Usage Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Cpu className="size-4 text-primary" />
                  CPU
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  Cores alocados: {inventory.cpu_cores}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col justify-between h-[140px]">
              <div>
                <span className="text-3xl font-bold tracking-tight">
                  {metrics ? formatPercentage(metrics.cpu_usage_percent) : '0.0%'}
                </span>
                <p className="text-xs text-muted-foreground mt-1">Uso de processamento em tempo real</p>
              </div>
              <ProgressBar
                value={metrics ? metrics.cpu_usage_percent : 0}
                showPercentage={false}
                className="h-2.5"
              />
            </CardContent>
          </Card>

          {/* Memory Usage Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <HardDrive className="size-4 text-primary" />
                  Memória RAM
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  Total: {formatBytes(inventory.memory_total_bytes)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col justify-between h-[140px]">
              <div>
                <span className="text-3xl font-bold tracking-tight">
                  {metrics ? formatBytes(metrics.memory_used_bytes) : '0 B'}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  Uso da memória física e swap ativa
                </p>
              </div>
              <div className="space-y-1">
                <ProgressBar
                  value={metrics ? metrics.memory_usage_percent : 0}
                  showPercentage={false}
                  className="h-2.5"
                />
                {metrics && metrics.swap_used_bytes > 0 && (
                  <p className="text-[10px] text-muted-foreground text-right">
                    Swap: {formatBytes(metrics.swap_used_bytes)} em uso
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Disk Usage Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Database className="size-4 text-primary" />
                  Disco Rígido
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  Total: {formatBytes(inventory.disk_total_bytes)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col justify-between h-[140px]">
              <div>
                <span className="text-3xl font-bold tracking-tight">
                  {metrics ? formatBytes(metrics.disk_used_bytes) : '0 B'}
                </span>
                <p className="text-xs text-muted-foreground mt-1">Uso de disco no rootfs alocado</p>
              </div>
              <ProgressBar
                value={metrics ? metrics.disk_usage_percent : 0}
                showPercentage={false}
                className="h-2.5"
              />
            </CardContent>
          </Card>

          {/* TODO: LEMBRAR DE REMOVER ESSE CARD OU IMPLEMTNAR UMA CHECAGEM DE FATO */}
          {/* Status Monitor Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                Saúde do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col justify-center h-[140px] space-y-2">
              <div className="flex justify-between items-center text-sm py-1 border-b border-border/30">
                <span className="text-muted-foreground">Estado Operacional</span>
                <span className="font-semibold text-green-500">Saudável</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-muted-foreground">Atualização Periódica</span>
                <span className="font-semibold text-muted-foreground flex items-center gap-1">
                  <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                  Ativa (5s)
                </span>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Network & Storage I/O Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Network Traffic Card */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Tráfego de Rede
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="p-2 rounded-md bg-blue-500/10 text-blue-500">
                <ArrowDownToLine className="size-5" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Download (RX)</span>
                <span className="text-lg font-bold">{metrics ? formatBytes(metrics.rx_bytes) : '0 B'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-500">
                <ArrowUpFromLine className="size-5" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Upload (TX)</span>
                <span className="text-lg font-bold">{metrics ? formatBytes(metrics.tx_bytes) : '0 B'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disk Storage I/O Card */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <Database className="size-4 text-primary" />
              E/S de Disco (I/O)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="p-2 rounded-md bg-amber-500/10 text-amber-500">
                <FileInput className="size-5" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Leitura (Read)</span>
                <span className="text-lg font-bold">{metrics ? formatBytes(metrics.io_read_bytes) : '0 B'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="p-2 rounded-md bg-orange-500/10 text-orange-500">
                <FileOutput className="size-5" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Escrita (Write)</span>
                <span className="text-lg font-bold">{metrics ? formatBytes(metrics.io_write_bytes) : '0 B'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default ContainerDetailsPage;
