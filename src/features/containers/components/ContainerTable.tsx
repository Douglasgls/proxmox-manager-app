import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatBytes } from '@/utils/bytes';
import { useStartContainer, useStopContainer, useRestartContainer } from '../hooks';
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Loading from '@/components/common/Loading';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import type { ContainerInventory } from '../types/index';

export type ContainerTableRow = ContainerInventory;

interface ContainerTableProps {
  data: ContainerTableRow[];
  isLoading?: boolean;
}

type SortField = 'container_id' | 'name' | 'cores' | 'memory' | 'disk' | 'status';
type SortDirection = 'asc' | 'desc';

export const ContainerTable: React.FC<ContainerTableProps> = ({ data, isLoading }) => {
  const navigate = useNavigate();
  const startMutation = useStartContainer();
  const stopMutation = useStopContainer();
  const restartMutation = useRestartContainer();

  const [sortConfig, setSortConfig] = useState<{ key: SortField; direction: SortDirection } | null>({
    key: 'status',
    direction: 'asc',
  });

  const getContainerStatus = (row: ContainerTableRow): string => {
    if (row.locked || row.lock) return 'locked';
    if (row.status === 'suspended') return 'suspended';
    return row.status || 'unknown';
  };

  const sortedData = useMemo(() => {
    const sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal: any = null;
        let bVal: any = null;

        switch (sortConfig.key) {
          case 'status':
            aVal = getContainerStatus(a);
            bVal = getContainerStatus(b);
            break;
          case 'name':
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case 'cores':
            aVal = a.cpu_cores ?? 0;
            bVal = b.cpu_cores ?? 0;
            break;
          case 'memory':
            aVal = a.memory_total_bytes ?? 0;
            bVal = b.memory_total_bytes ?? 0;
            break;
          case 'disk':
            aVal = a.disk_total_bytes ?? 0;
            bVal = b.disk_total_bytes ?? 0;
            break;
          case 'container_id':
          default:
            aVal = a.container_id ?? 0;
            bVal = b.container_id ?? 0;
            break;
        }

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key: SortField) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortHeader = (label: string, field: SortField, className?: string) => {
    const isSorted = sortConfig?.key === field;
    const direction = sortConfig?.direction;

    return (
      <TableHead
        className={`cursor-pointer hover:bg-muted/70 hover:text-foreground transition-colors duration-150 select-none text-xs font-semibold uppercase tracking-wider text-muted-foreground align-middle ${className}`}
        onClick={() => requestSort(field)}
      >
        <div className="flex items-center justify-center gap-1">
          <span>{label}</span>
          {isSorted ? (
            direction === 'asc' ? (
              <ArrowUp className="size-3 text-primary shrink-0" />
            ) : (
              <ArrowDown className="size-3 text-primary shrink-0" />
            )
          ) : (
            <ArrowUpDown className="size-3 text-muted-foreground/40 hover:text-muted-foreground shrink-0 transition-colors" />
          )}
        </div>
      </TableHead>
    );
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <Table className="w-full text-sm border-collapse text-left">
        <TableHeader className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
          <TableRow>
            {renderSortHeader('Status', 'status', 'w-24 text-center')}
            {renderSortHeader('CT ID', 'container_id', 'w-20 text-center')}
            {renderSortHeader('Nome', 'name', 'w-36 text-center')}
            {renderSortHeader('Cores', 'cores', 'w-20 text-center')}
            {renderSortHeader('Memória', 'memory', 'w-28 text-center')}
            {renderSortHeader('Disco', 'disk', 'w-28 text-center')}
            <TableHead className="h-10 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground align-middle w-36 text-center">
              Endereço IP
            </TableHead>
            <TableHead className="h-10 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground align-middle w-60 text-center">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/50 text-foreground">
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center">
                <Loading message="Carregando dados..." />
              </TableCell>
            </TableRow>
          ) : sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground text-sm font-medium">
                Nenhum container LXC encontrado no cluster.
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row, rowIndex) => {
              const isRunning = row.status?.toLowerCase() === 'running';
              const isLocked = !!(row.locked || row.lock);
              const containerId = row.id;

              const isStarting = startMutation.isPending && startMutation.variables === containerId;
              const isStopping = stopMutation.isPending && stopMutation.variables === containerId;
              const isRestarting = restartMutation.isPending && restartMutation.variables === containerId;
              const isAnyActionPending = isStarting || isStopping || isRestarting;

              return (
                <TableRow
                  key={row.id || rowIndex}
                  className="hover:bg-muted/40 cursor-pointer transition-colors duration-150 border-b border-border/50 group"
                  onClick={() => navigate(`/containers/${row.id}`)}
                >
                  <TableCell className="w-24 text-center align-middle font-medium">
                    <StatusBadge type="container" status={getContainerStatus(row)} />
                  </TableCell>
                  <TableCell className="w-20 text-center align-middle font-mono text-xs font-bold text-muted-foreground">
                    #{row.container_id}
                  </TableCell>
                  <TableCell className="w-36 font-semibold text-center truncate align-middle">
                    <span className="text-primary group-hover:underline font-semibold transition-colors duration-150">
                      {row.name}
                    </span>
                  </TableCell>
                  <TableCell className="w-20 text-center align-middle font-medium">
                    {row.cpu_cores}
                  </TableCell>
                  <TableCell className="w-28 text-center align-middle font-medium">
                    {formatBytes(row.memory_total_bytes)}
                  </TableCell>
                  <TableCell className="w-28 text-center align-middle font-medium">
                    {formatBytes(row.disk_total_bytes)}
                  </TableCell>
                  <TableCell className="w-36 text-center align-middle font-mono text-xs text-muted-foreground">
                    {row.ip_address || '-'}
                  </TableCell>
                  <TableCell className="w-60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
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
                      {!isRunning || isLocked || isAnyActionPending ? (
                        <Button
                          variant="outline"
                          size="xs"
                          disabled
                          className="text-xs px-2 h-7"
                        >
                          Console
                        </Button>
                      ) : (
                        <Link to={`/app/containers/${row.id}/console`}>
                          <Button
                            variant="outline"
                            size="xs"
                            className="text-xs px-2 h-7"
                          >
                            Console
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ContainerTable;
