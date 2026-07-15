import React from 'react';
import { ProgressBar } from '@/components/common/ProgressBar';

interface JobProgressProps {
  progress: number;
  status: string;
}

/**
 * Barra de progresso para jobs em execução.
 * Renderiza apenas quando o status é 'running'.
 */
export const JobProgress: React.FC<JobProgressProps> = ({ progress, status }) => {
  if (status !== 'running') return null;

  return (
    <div className="flex items-center gap-2">
      <ProgressBar value={progress} showPercentage height="sm" />
    </div>
  );
};

export default JobProgress;
