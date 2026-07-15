import React from 'react';
import DataTable from '@/components/common/DataTable';
import type { ColumnDefinition } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { formatDateTime } from '@/utils/date';
import type { Job } from '../types';
import JobStatusBadge from './JobStatusBadge';

interface JobsTableProps {
  data: Job[];
  isLoading: boolean;
  onViewDetails: (jobId: string) => void;
}

/**
 * Calcula a duração entre started_at e finished_at.
 * Se ainda estiver executando, retorna '--'.
 */
const formatDuration = (startedAt: string, finishedAt: string, status: string): string => {
  if (status === 'running' || status === 'pending') return '--';
  if (!startedAt || !finishedAt) return '--';

  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();
  if (isNaN(start) || isNaN(end)) return '--';

  const diffMs = end - start;
  if (diffMs < 0) return '--';

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
};

/**
 * Tabela de Jobs reutilizando o DataTable existente.
 */
export const JobsTable: React.FC<JobsTableProps> = ({ data, isLoading, onViewDetails }) => {
  const columns: ColumnDefinition<Job>[] = [
    {
      header: 'Status',
      accessor: (row) => <JobStatusBadge status={row.status} />,
      className: 'w-32 text-center',
    },
    {
      header: 'Tipo',
      accessor: (row) => (
        <span className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded">{row.type}</span>
      ),
      className: 'w-36 text-center',
    },
    {
      header: 'Container',
      accessor: (row) => row.target_container || '-',
      className: 'w-36 max-w-24 truncate text-center',
    },
    {
      header: 'Etapa Atual',
      accessor: (row) => row.current_step || '-',
      className: 'w-40 text-center',
    },
    /* {
      header: 'Componente Atual',
      accessor: (row) => row.current_component || '-',
      className: 'w-40',
    }, */
    {
      header: 'Início',
      accessor: (row) => formatDateTime(row.started_at),
      className: 'w-44 text-center',
    },
    /* {
      header: 'Fim',
      accessor: (row) =>
        row.status === 'running' ? (
          <span className="text-blue-500 font-medium flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
            Em execução...
          </span>
        ) : (
          formatDateTime(row.finished_at)
        ),
      className: 'w-44',
    },*/
    {
      header: 'Duração',
      accessor: (row) => (
        <span className="font-mono text-xs">
          {formatDuration(row.started_at, row.finished_at, row.status)}
        </span>
      ),
      className: 'w-28 text-center',
    },
    {
      header: 'Ações',
      accessor: (row) => (
        <Button
          variant="ghost"
          size="xs"
          className="gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(row.id);
          }}
        >
          <Eye className="size-3.5" />
          Detalhes
        </Button>
      ),
      className: 'w-28 text-center',
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="Nenhuma tarefa encontrada."
    />
  );
};

export default JobsTable;
