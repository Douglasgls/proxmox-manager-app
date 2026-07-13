import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DataTable, type ColumnDefinition } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatBytes } from '@/utils/bytes';
import { formatPercentage } from '@/utils/number';
import { useStartContainer, useStopContainer, useRestartContainer } from '../hooks';
import { Loader2 } from 'lucide-react';
import type { ContainerInventory, ContainerMetrics } from '../types/index';

export interface ContainerTableRow extends ContainerInventory {
  metrics?: ContainerMetrics;
}

interface ContainerTableProps {
  data: ContainerTableRow[];
  isLoading?: boolean;
}

export const ContainerTable: React.FC<ContainerTableProps> = ({ data, isLoading }) => {
  const startMutation = useStartContainer();
  const stopMutation = useStopContainer();
  const restartMutation = useRestartContainer();

  // Helper to determine status to pass to badge
  const getContainerStatus = (row: ContainerTableRow): string => {
    if (row.locked || row.lock) return 'locked';
    if (row.status === 'suspended') return 'suspended';
    return row.status || 'unknown';
  };

  // Helper to format status for text display
  // const getContainerEstadoLabel = (row: ContainerTableRow): string => {
  //   if (row.locked || row.lock) return 'Locked';
  //   if (row.status === 'suspended') return 'Suspended';
  //   const status = row.status?.toLowerCase();
  //   if (status === 'running') return 'Running';
  //   if (status === 'stopped') return 'Stopped';
  //   return row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Unknown';
  // };

  const columns: ColumnDefinition<ContainerTableRow>[] = [
    {
      header: 'Status',
      accessor: (row) => (
        <StatusBadge type="container" status={getContainerStatus(row)} />
      ),
      className: 'w-24 text-center',
    },
    {
      header: 'Nome',
      accessor: (row) => (
        <Link
          to={`/containers/${row.id}`}
          className="text-primary hover:underline font-semibold transition-colors duration-150"
        >
          {row.name}
        </Link>
      ),
      className: 'w-12 font-semibold text-center',
    },
    {
      header: 'CPU %',
      accessor: (row) =>
        row.metrics ? formatPercentage(row.metrics.cpu_usage_percent) : '0.0%',
      className: 'w-24 text-center',
    },
    {
      header: 'Memória',
      accessor: (row) => {
        // const total = row.memory_total_bytes;
        // const used = row.metrics ? row.metrics.memory_used_bytes : 0;
        const usagePercent = row.metrics ? row.metrics.memory_usage_percent : 0;

        return (
          <div className="flex flex-col gap-0.5">
            {/* <span className="text-sm font-medium">
              {formatBytes(used)}
            </span> */}
            <span className="text-md text-muted-foreground font-normal">
              {formatPercentage(usagePercent)}
            </span>
          </div>
        );
      },
      className: 'w-24 text-center',
    },
    {
      header: 'Disco',
      accessor: (row) => {
        // const total = row.disk_total_bytes;
        // const used = row.metrics ? row.metrics.disk_used_bytes : 0;
        const usagePercent = row.metrics ? row.metrics.disk_usage_percent : 0;

        return (
          <div className="flex flex-col gap-0.5">
            {/* <span className="text-sm font-medium">
              {formatBytes(used)}
            </span> */}
            <span className="text-md text-muted-foreground font-normal">
              {formatPercentage(usagePercent)}
            </span>
          </div>
        );
      },
      className: 'w-24 text-center',
    },
    {
      header: 'RX',
      accessor: (row) => (row.metrics ? formatBytes(row.metrics.rx_bytes) : '-'),
      className: 'w-24 truncate text-center',
    },
    {
      header: 'TX',
      accessor: (row) => (row.metrics ? formatBytes(row.metrics.tx_bytes) : '-'),
      className: 'w-24 truncate text-center',
    },
    {
      header: 'CPU Cores',
      accessor: (row) => `${row.cpu_cores}`,
      className: 'w-24 text-center truncate text-center',
    },
    // {
    //   header: 'Estado',
    //   accessor: (row) => getContainerEstadoLabel(row),
    //   className: 'w-28 font-medium text-muted-foreground',
    // },
    {
      header: 'Ações',
      accessor: (row) => {
        const isRunning = row.status?.toLowerCase() === 'running';
        const isLocked = !!(row.locked || row.lock);
        const containerId = row.id;

        const isStarting = startMutation.isPending && startMutation.variables === containerId;
        const isStopping = stopMutation.isPending && stopMutation.variables === containerId;
        const isRestarting = restartMutation.isPending && restartMutation.variables === containerId;
        const isAnyActionPending = isStarting || isStopping || isRestarting;

        return (
          <div className="flex gap-1.5 flex-wrap text-center justify-center">
            <Button
              variant="outline"
              size="xs"
              disabled={isRunning || isLocked || isAnyActionPending}
              onClick={() => startMutation.mutate(containerId)}
              className="text-xs px-2 h-7 gap-1"
            >
              {isStarting && <Loader2 className="size-3 animate-spin text-primary" />}
              Start
            </Button>
            <Button
              variant="outline"
              size="xs"
              disabled={!isRunning || isLocked || isAnyActionPending}
              onClick={() => stopMutation.mutate(containerId)}
              className="text-xs px-2 h-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1"
            >
              {isStopping && <Loader2 className="size-3 animate-spin text-red-500" />}
              Stop
            </Button>
            <Button
              variant="outline"
              size="xs"
              disabled={!isRunning || isLocked || isAnyActionPending}
              onClick={() => restartMutation.mutate(containerId)}
              className="text-xs px-2 h-7 gap-1"
            >
              {isRestarting && <Loader2 className="size-3 animate-spin text-primary" />}
              Restart
            </Button>
            {/* <Button
              variant="outline"
              size="xs"
              disabled={!isRunning}
              className="text-xs px-2 h-7"
            >
              Console
            </Button> */}
          </div>
        );
      },
      className: 'w-64 text-center',
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="Nenhum container LXC encontrado no cluster."
    />
  );
};
