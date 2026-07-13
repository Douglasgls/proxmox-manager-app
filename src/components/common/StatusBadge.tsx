import React from 'react';
import { CONTAINER_STATUS_COLORS, JOB_STATUS_COLORS } from '@/utils/constants';
import { cn } from '@/lib/utils';

type ContainerStatus = keyof typeof CONTAINER_STATUS_COLORS;
type JobStatus = keyof typeof JOB_STATUS_COLORS;

interface StatusBadgeProps {
  status: ContainerStatus | JobStatus | string;
  type: 'container' | 'job';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type,
  className,
}) => {
  const normalizedStatus = status.toLowerCase();
  
  let colorClasses = 'text-gray-500 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  let label = status;

  if (type === 'container') {
    if (normalizedStatus in CONTAINER_STATUS_COLORS) {
      colorClasses = CONTAINER_STATUS_COLORS[normalizedStatus as ContainerStatus];
    }
    // Tradução básica dos status de containers
    const labels: Record<string, string> = {
      running: 'Executando',
      stopped: 'Parado',
      paused: 'Pausado',
      locked: 'Bloqueado',
      suspended: 'Suspenso',
      unknown: 'Desconhecido',
    };
    label = labels[normalizedStatus] || status;
  } else {
    if (normalizedStatus in JOB_STATUS_COLORS) {
      colorClasses = JOB_STATUS_COLORS[normalizedStatus as JobStatus];
    }
    // Tradução básica dos status de jobs
    const labels: Record<string, string> = {
      running: 'Em execução',
      done: 'Concluído',
      failed: 'Falhou',
      stopped: 'Interrompido',
    };
    label = labels[normalizedStatus] || status;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors duration-200',
        colorClasses,
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
};
export default StatusBadge;
