import React from 'react';
import StatusBadge from '@/components/common/StatusBadge';
import type { JobStatus } from '../types';

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

/**
 * Badge colorida para status de Jobs.
 * Reutiliza o StatusBadge existente mapeando os novos status do backend.
 */
export const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ status, className }) => {
  return <StatusBadge type="job" status={status} className={className} />;
};

export default JobStatusBadge;
