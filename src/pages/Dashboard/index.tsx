import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ErrorAlert from '@/components/common/Error';
import Loading from '@/components/common/Loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { inventoryApi } from '@/api/modules/inventoryApi';
import { formatBytes } from '@/utils/bytes';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useDashboardMetrics } from '@/hooks/websocket/useDashboardMetrics';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Disc,
  FileCode2,
  Network,
  Database,
  ExternalLink,
  ShieldAlert,
  KeyRound,
  Settings,
  RefreshCw,
} from 'lucide-react';

// Regra de cores do medidor conforme a auditoria de design
const getMeterTone = (percent: number) => {
  if (percent >= 90) {
    return { bar: 'bg-red-400', text: 'text-red-300' };
  }
  if (percent >= 75) {
    return { bar: 'bg-amber-400', text: 'text-amber-300' };
  }
  return { bar: 'bg-[#F47732]', text: 'text-white' };
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
    queryKey: ['networks'],
    queryFn: inventoryApi.getNetworks,
  });

  // Ordenação das Interfaces de Rede
  const sortedInterfaces = useMemo(() => {
    if (!networks?.interfaces) return [];

    return [...networks.interfaces].sort((a, b) => {
      const getRank = (net: typeof a) => {
        const hasIp = Boolean(
          net.address &&
            net.address.trim() !== '' &&
            net.address !== 'Não atribuído'
        );
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
                <h3 className="text-lg font-bold text-foreground">
                  Permissão Insuficiente no Proxmox VE
                </h3>
                <Badge variant="warning" className="text-xs">
                  403 Forbidden
                </Badge>
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
              <li>
                Acesse o Proxmox VE &gt; <strong>Datacenter</strong> &gt; aba <strong>Permissions</strong>.
              </li>
              <li>
                Clique no botão <strong>Add</strong> &gt; selecione <strong>API Token Permission</strong> (ou <em>User Permission</em>).
              </li>
              <li>
                Defina o campo <strong>Path</strong> como{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground font-semibold">
                  {errData?.path || '/nodes/pve'}
                </code>{' '}
                (ou <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground font-semibold">/</code>).
              </li>
              <li>
                Atribua a Role <strong className="text-foreground font-semibold">PVEAuditor</strong> (ou <em>Administrator</em>) ao token.
              </li>
              <li>
                Marque a opção <strong>Propagate</strong> (Propagar) e clique em <strong>Add</strong>.
              </li>
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

    return (
      <ErrorAlert
        title="Não foi possível carregar os dados"
        onRetry={() => {
          refetchHost();
        }}
      />
    );
  }

  // Resolução segura de metadados do host para evitar erros com campos indefinidos
  const nodeName = (host?.hostname || (host as any)?.node || 'PVE').toUpperCase();
  const cpuModel = host?.cpu_model || 'Processador';
  const cpuCores = host?.cpu_cores ?? 0;
  const cpuThreads = host?.cpu_threads ?? 0;
  const memoryTotal = host?.memory_total_bytes ?? 0;
  const swapTotal = host?.swap_total_bytes ?? 0;
  const kernelVersion = host?.kernel_version
    ? host.kernel_version.split(' ')[1] || host.kernel_version
    : '--';
  const architecture = host?.architecture ?? 'amd64';
  const proxmoxVersion = host?.proxmox_version
    ? host.proxmox_version.split('/')[1] || host.proxmox_version
    : '--';

  // Cálculos de Percentual de Recursos
  const cpuPercent = Math.min(Math.max(metrics?.cpu_usage_percent || 0, 0), 100);
  const ramPercent =
    memoryTotal > 0
      ? Math.min(Math.max(((metrics?.memory_used_bytes || 0) / memoryTotal) * 100, 0), 100)
      : 0;
  const swapPercent =
    swapTotal > 0
      ? Math.min(Math.max(((metrics?.swap_used_bytes || 0) / swapTotal) * 100, 0), 100)
      : 0;
  const diskTotal = (metrics?.disk_used_bytes || 0) + (metrics?.disk_free_bytes || 0);
  const diskPercent =
    diskTotal > 0
      ? Math.min(Math.max(((metrics?.disk_used_bytes || 0) / diskTotal) * 100, 0), 100)
      : 0;

  // Cores dinâmicas para métricas
  const cpuTone = getMeterTone(cpuPercent);
  const ramTone = getMeterTone(ramPercent);
  const swapTone = getMeterTone(swapPercent);
  const diskTone = getMeterTone(diskPercent);

  // Proporção de containers LXC
  const totalContainers = host?.containers_total || 0;
  const runningRatio = totalContainers > 0 ? ((host?.containers_running || 0) / totalContainers) * 100 : 0;
  const stoppedRatio = totalContainers > 0 ? ((host?.containers_stopped || 0) / totalContainers) * 100 : 0;
  const suspendedRatio = totalContainers > 0 ? ((host?.containers_suspended || 0) / totalContainers) * 100 : 0;

  // IP primário para acesso ao Proxmox
  const primaryIp =
    networks?.interfaces?.find(
      (n) => n.address && n.address !== '127.0.0.1' && n.address !== 'Não atribuído'
    )?.address || '127.0.0.1';

  const loadAvg = Array.isArray(metrics?.load_average)
    ? metrics.load_average
    : [0, 0, 0];

  return (
    <div className="space-y-4 max-w-[1320px] mx-auto text-foreground">
      {/* 1. CABEÇALHO DA PÁGINA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
            Nó {nodeName}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
            Visão geral do host
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Visão geral e monitoramento do nó {nodeName}.
          </p>
        </div>

        {/* Link Externo Proxmox VE */}
        <a
          href={`https://${primaryIp}:8006`}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-3.5 px-4 py-2.5 rounded-xl border border-white/10 bg-[#171717] hover:border-[#F47732]/50 transition-colors shadow-sm"
        >
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-mono tracking-wider text-white/40">
              Para mais dados acesse
            </span>
            <span className="text-xs font-mono font-medium text-white group-hover:text-[#F47732] transition-colors">
              https://{primaryIp}:8006
            </span>
          </div>
          <ExternalLink className="size-4 text-white/40 group-hover:text-[#F47732] transition-colors" />
        </a>
      </div>

      {/* 2. FAIXA DO HOST (Hardware e Versões) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1.7fr_1fr_1fr_0.9fr] gap-px rounded-xl overflow-hidden border border-white/8 bg-white/8 shadow-sm">
        {/* Processador */}
        <div className="bg-[#171717] px-5 py-4 min-w-0 flex flex-col justify-between col-span-2 sm:col-span-3 lg:col-span-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block mb-1">
            Processador
          </span>
          <p
            className="text-sm font-medium text-white truncate"
            title={cpuModel}
          >
            {cpuModel}
          </p>
          <p className="text-xs text-white/45 mt-1 font-mono">
            {cpuCores} Cores / {cpuThreads} Threads
          </p>
        </div>

        {/* Memória Física */}
        <div className="bg-[#171717] px-5 py-4 min-w-0 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block mb-1">
            Memória Física
          </span>
          <p className="text-sm font-medium text-white font-mono">
            {formatBytes(memoryTotal)} RAM
          </p>
          <p className="text-xs text-white/45 mt-1 font-mono">
            {formatBytes(swapTotal)} Swap
          </p>
        </div>

        {/* Kernel Linux */}
        <div className="bg-[#171717] px-5 py-4 min-w-0 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block mb-1">
            Kernel Linux
          </span>
          <p
            className="text-sm font-medium text-white truncate font-mono"
            title={kernelVersion}
          >
            {kernelVersion}
          </p>
          <p className="text-xs text-white/45 mt-1 font-mono">
            {architecture}
          </p>
        </div>

        {/* Proxmox VE */}
        <div className="bg-[#171717] px-5 py-4 min-w-0 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block mb-1">
            Proxmox VE
          </span>
          <p
            className="text-sm font-medium text-white truncate font-mono"
            title={proxmoxVersion}
          >
            {proxmoxVersion}
          </p>
          <p className="text-xs text-white/45 mt-1">Versão do Manager</p>
        </div>
      </div>

      {/* 3. LINHA 2: RECURSOS (7/12) E CONTÊINERES (5/12) */}
      <div className="grid gap-4 xl:grid-cols-12 items-stretch">
        {/* CARD: Uso de Recursos */}
        <section className="xl:col-span-7 flex flex-col rounded-xl border border-white/10 bg-[#171717] h-full shadow-sm">
          <div className="min-h-[52px] px-5 py-3 border-b border-white/8 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-sm font-semibold tracking-wide text-white">
              Uso de recursos
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#F47732] animate-pulse" />
              <span className="text-[11px] font-mono text-white/40">Tempo real</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-7 p-5 flex-1 content-center">
            {/* CPU */}
            <div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="uppercase font-medium text-white/70">CPU</span>
                <span className={`text-2xl font-bold font-mono tabular-nums ${cpuTone.text}`}>
                  {cpuPercent.toFixed(1)}
                  <span className="text-sm font-normal text-white/40 ml-0.5">%</span>
                </span>
              </div>
              <div
                className="mt-2.5 h-2 w-full rounded-full bg-white/8 overflow-hidden"
                role="progressbar"
                aria-valuenow={cpuPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Uso de CPU"
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${cpuTone.bar}`}
                  style={{ width: cpuPercent > 0 ? `${Math.max(cpuPercent, 1.5)}%` : '0%' }}
                />
              </div>
              <p className="mt-2 text-[11px] font-mono text-white/40">
                {host.cpu_cores} cores / {host.cpu_threads} threads
              </p>
            </div>

            {/* RAM */}
            <div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="uppercase font-medium text-white/70">RAM</span>
                <span className={`text-2xl font-bold font-mono tabular-nums ${ramTone.text}`}>
                  {ramPercent.toFixed(1)}
                  <span className="text-sm font-normal text-white/40 ml-0.5">%</span>
                </span>
              </div>
              <div
                className="mt-2.5 h-2 w-full rounded-full bg-white/8 overflow-hidden"
                role="progressbar"
                aria-valuenow={ramPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Uso de Memória RAM"
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${ramTone.bar}`}
                  style={{ width: ramPercent > 0 ? `${Math.max(ramPercent, 1.5)}%` : '0%' }}
                />
              </div>
              <p className="mt-2 text-[11px] font-mono text-white/40">
                {formatBytes(metrics.memory_used_bytes)} de {formatBytes(host.memory_total_bytes)}
              </p>
            </div>

            {/* Swap */}
            <div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="uppercase font-medium text-white/70">Swap</span>
                <span className={`text-2xl font-bold font-mono tabular-nums ${swapTone.text}`}>
                  {swapPercent.toFixed(1)}
                  <span className="text-sm font-normal text-white/40 ml-0.5">%</span>
                </span>
              </div>
              <div
                className="mt-2.5 h-2 w-full rounded-full bg-white/8 overflow-hidden"
                role="progressbar"
                aria-valuenow={swapPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Uso de Swap"
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${swapTone.bar}`}
                  style={{ width: swapPercent > 0 ? `${Math.max(swapPercent, 1.5)}%` : '0%' }}
                />
              </div>
              <p className="mt-2 text-[11px] font-mono text-white/40">
                {formatBytes(metrics.swap_used_bytes)} de {formatBytes(host.swap_total_bytes)}
              </p>
            </div>

            {/* Disco (Root) */}
            <div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="uppercase font-medium text-white/70">Disco (Root)</span>
                <span className={`text-2xl font-bold font-mono tabular-nums ${diskTone.text}`}>
                  {diskPercent.toFixed(1)}
                  <span className="text-sm font-normal text-white/40 ml-0.5">%</span>
                </span>
              </div>
              <div
                className="mt-2.5 h-2 w-full rounded-full bg-white/8 overflow-hidden"
                role="progressbar"
                aria-valuenow={diskPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Uso de Disco Root"
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${diskTone.bar}`}
                  style={{ width: diskPercent > 0 ? `${Math.max(diskPercent, 1.5)}%` : '0%' }}
                />
              </div>
              <p className="mt-2 text-[11px] font-mono text-white/40">
                {formatBytes(metrics.disk_used_bytes)} de {formatBytes(diskTotal)}
              </p>
            </div>
          </div>

          {/* Rodapé Load Average */}
          <div className="border-t border-white/8 px-5 py-3.5 flex flex-wrap items-center gap-x-8 gap-y-2">
            <span className="text-xs font-medium text-white/60">Load average</span>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase text-white/35">1 MIN</span>
                <span className="font-mono text-xs font-medium text-white">
                  {loadAvg[0] !== undefined ? loadAvg[0].toFixed(2) : '--'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase text-white/35">5 MIN</span>
                <span className="font-mono text-xs font-medium text-white">
                  {loadAvg[1] !== undefined ? loadAvg[1].toFixed(2) : '--'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase text-white/35">15 MIN</span>
                <span className="font-mono text-xs font-medium text-white">
                  {loadAvg[2] !== undefined ? loadAvg[2].toFixed(2) : '--'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* CARD: Inventário de Contêineres (LXC) */}
        <section className="xl:col-span-5 flex flex-col rounded-xl border border-white/10 bg-[#171717] h-full shadow-sm">
          <div className="min-h-[52px] px-5 py-3 border-b border-white/8 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-white">
              Inventário de contêineres (LXC)
            </h2>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between">
            {/* Total e Barra Proporcional */}
            <div>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold tracking-tight text-white leading-none font-mono">
                  {totalContainers}
                </span>
                <span className="text-xs text-white/50 pb-1">
                  {totalContainers === 1 ? 'contêiner no total' : 'contêineres no total'}
                </span>
              </div>

              <div
                className="mt-4 flex h-2 gap-0.5 rounded-full bg-white/8 overflow-hidden"
                role="img"
                aria-label={`Executando: ${host.containers_running}, Parados: ${host.containers_stopped}, Suspensos: ${host.containers_suspended}`}
              >
                {runningRatio > 0 && (
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${runningRatio}%` }}
                    title={`Executando: ${host.containers_running}`}
                  />
                )}
                {stoppedRatio > 0 && (
                  <div
                    className="h-full bg-red-400 transition-all duration-500"
                    style={{ width: `${stoppedRatio}%` }}
                    title={`Parados: ${host.containers_stopped}`}
                  />
                )}
                {suspendedRatio > 0 && (
                  <div
                    className="h-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${suspendedRatio}%` }}
                    title={`Suspensos: ${host.containers_suspended}`}
                  />
                )}
              </div>

              {/* Lista de Estados */}
              <div className="divide-y divide-white/8 mt-4 text-[13px]">
                {/* Em execução */}
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`size-2 rounded-full ${
                        host.containers_running > 0 ? 'bg-emerald-400' : 'bg-white/15'
                      }`}
                    />
                    <span className="text-white/80">Em execução</span>
                  </div>
                  <span
                    className={`font-mono text-xs ${
                      host.containers_running > 0
                        ? 'text-emerald-400 font-semibold'
                        : 'text-white/35'
                    }`}
                  >
                    {host.containers_running}
                  </span>
                </div>

                {/* Parados */}
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`size-2 rounded-full ${
                        host.containers_stopped > 0 ? 'bg-red-400' : 'bg-white/15'
                      }`}
                    />
                    <span className="text-white/80">Parados</span>
                  </div>
                  <span
                    className={`font-mono text-xs ${
                      host.containers_stopped > 0
                        ? 'text-red-400 font-semibold'
                        : 'text-white/35'
                    }`}
                  >
                    {host.containers_stopped}
                  </span>
                </div>

                {/* Suspensos */}
                <div className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`size-2 rounded-full ${
                        host.containers_suspended > 0 ? 'bg-amber-400' : 'bg-white/15'
                      }`}
                    />
                    <span className="text-white/80">Suspensos</span>
                  </div>
                  <span
                    className={`font-mono text-xs ${
                      host.containers_suspended > 0
                        ? 'text-amber-400 font-semibold'
                        : 'text-white/35'
                    }`}
                  >
                    {host.containers_suspended}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé: Templates e Imagens ISO */}
          <div className="grid grid-cols-2 border-t border-white/8">
            <div className="px-5 py-3.5 flex items-center justify-between border-r border-white/8">
              <div className="flex items-center gap-2 text-white/60">
                <FileCode2 className="size-4 text-white/35" />
                <span className="text-xs">Templates</span>
              </div>
              <span className="font-mono text-xs font-semibold text-white">
                {host.template_count}
              </span>
            </div>

            <div className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/60">
                <Disc className="size-4 text-white/35" />
                <span className="text-xs">Imagens ISO</span>
              </div>
              <span className="font-mono text-xs font-semibold text-white">
                {host.iso_count}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* 4. LINHA 3: STORAGES (5/12) E INTERFACES (7/12) */}
      <div className="grid gap-4 xl:grid-cols-12 items-start">
        {/* CARD: Armazenamento (Storages) */}
        <section className="xl:col-span-5 flex flex-col rounded-xl border border-white/10 bg-[#171717] shadow-sm overflow-hidden">
          <div className="min-h-[52px] px-5 py-3 border-b border-white/8 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-white">
              Armazenamento (Storages)
            </h2>
          </div>

          {/* Cabeçalho da Tabela em Grid */}
          <div className="hidden md:grid grid-cols-[1.4fr_1fr_1fr_84px] px-5 py-2.5 border-b border-white/8 text-[10px] uppercase font-mono tracking-wider text-white/40 bg-white/[0.02]">
            <span>Storage</span>
            <span>Tipo</span>
            <span>Capacidade</span>
            <span className="text-right">Estado</span>
          </div>

          {/* Linhas */}
          <div className="divide-y divide-white/8">
            {storages && storages.length > 0 ? (
              storages.map((storage) => {
                const totalBytes = storage.total_bytes || storage.total || 0;
                return (
                  <div
                    key={storage.name || storage.storage}
                    className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_84px] items-center px-5 py-3.5 text-xs gap-y-2 md:gap-y-0 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Nome do Storage */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Database className="size-3.5 text-[#F47732] shrink-0" />
                      <span
                        className="font-medium text-white truncate"
                        title={storage.name || storage.storage}
                      >
                        {storage.name || storage.storage}
                      </span>
                    </div>

                    {/* Tipo */}
                    <div>
                      <span className="inline-block rounded bg-white/8 px-1.5 py-0.5 font-mono text-[10px] text-white/70 uppercase">
                        {storage.storage_type || storage.type}
                      </span>
                    </div>

                    {/* Capacidade */}
                    <div className="font-mono text-xs text-white tabular-nums">
                      {formatBytes(totalBytes)}
                    </div>

                    {/* Estado */}
                    <div className="flex md:justify-end">
                      {storage.active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          ATIVO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider bg-white/5 text-white/40 border border-white/10">
                          <span className="size-1.5 rounded-full bg-white/30" />
                          INATIVO
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-5 text-center text-xs text-white/40 font-mono">
                Nenhum storage configurado.
              </div>
            )}
          </div>
        </section>

        {/* CARD: Interfaces de Rede */}
        <section className="xl:col-span-7 flex flex-col rounded-xl border border-white/10 bg-[#171717] shadow-sm overflow-hidden">
          <div className="min-h-[52px] px-5 py-3 border-b border-white/8 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-sm font-semibold tracking-wide text-white">
              Interfaces de rede
            </h2>
            <div className="flex items-center gap-4 text-[11px] font-mono text-white/60">
              <span className="flex items-center gap-1">
                <ArrowDownToLine className="size-3 text-emerald-400" />
                RX <strong className="font-normal text-white/80">{metrics?.rx_bytes && metrics.rx_bytes > 0 ? formatBytes(metrics.rx_bytes) : '—'}</strong>
              </span>
              <span className="flex items-center gap-1">
                <ArrowUpFromLine className="size-3 text-[#F47732]" />
                TX <strong className="font-normal text-white/80">{metrics?.tx_bytes && metrics.tx_bytes > 0 ? formatBytes(metrics.tx_bytes) : '—'}</strong>
              </span>
            </div>
          </div>

          {/* Cabeçalho da Tabela em Grid */}
          <div className="hidden md:grid grid-cols-[1fr_0.8fr_1.3fr_0.6fr_1.2fr_72px] px-5 py-2.5 border-b border-white/8 text-[10px] uppercase font-mono tracking-wider text-white/40 bg-white/[0.02]">
            <span>Interface</span>
            <span>Tipo</span>
            <span>IP</span>
            <span>Máscara</span>
            <span>Gateway</span>
            <span className="text-right">Estado</span>
          </div>

          {/* Linhas */}
          <div className="divide-y divide-white/8">
            {sortedInterfaces && sortedInterfaces.length > 0 ? (
              sortedInterfaces.map((network) => {
                const name = network.name || network.iface || '';
                const type = network.interface_type || network.type || '';
                const ip = network.address && network.address !== 'Não atribuído' ? network.address : null;
                const netmask = network.netmask || null;
                const gateway = network.gateway || null;

                return (
                  <div
                    key={name}
                    className="grid grid-cols-1 md:grid-cols-[1fr_0.8fr_1.3fr_0.6fr_1.2fr_72px] items-center px-5 py-3.5 text-xs gap-y-2 md:gap-y-0 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Interface */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Network className="size-3.5 text-[#F47732] shrink-0" />
                      <span className="font-mono text-xs font-medium text-white truncate" title={name}>
                        {name}
                      </span>
                    </div>

                    {/* Tipo */}
                    <div>
                      <span className="inline-block rounded bg-white/8 px-1.5 py-0.5 font-mono text-[10px] text-white/70 uppercase">
                        {type}
                      </span>
                    </div>

                    {/* IP */}
                    <div className="font-mono text-xs truncate">
                      {ip ? (
                        <span className="text-white">{ip}</span>
                      ) : (
                        <span className="text-white/40 font-sans">Não atribuído</span>
                      )}
                    </div>

                    {/* Máscara */}
                    <div className="font-mono text-xs text-white/70 truncate">
                      {netmask || '—'}
                    </div>

                    {/* Gateway */}
                    <div className="font-mono text-xs text-white/70 truncate">
                      {gateway || '—'}
                    </div>

                    {/* Estado */}
                    <div className="flex md:justify-end">
                      {network.active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          ATIVA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider bg-white/5 text-white/40 border border-white/10">
                          <span className="size-1.5 rounded-full bg-white/30" />
                          INATIVA
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-5 text-center text-xs text-white/40 font-mono">
                Nenhuma interface encontrada.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Botão Flutuante de Ajuda (?) */}
      <button
        type="button"
        className="fixed bottom-4 right-4 size-8 rounded-full border border-white/10 bg-[#171717] hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center text-xs font-mono transition-colors shadow-lg z-40 focus:outline-none"
        title="Ajuda e Documentação"
        onClick={() => window.open('https://pve.proxmox.com/pve-docs/', '_blank')}
      >
        ?
      </button>
    </div>
  );
};

export default Dashboard;
