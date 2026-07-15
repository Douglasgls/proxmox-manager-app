import React from 'react';
import { AlertCircle } from 'lucide-react';

interface JobErrorAlertProps {
  error: string;
}

/**
 * Alerta estilizado para exibir mensagens de erro de Jobs.
 */
export const JobErrorAlert: React.FC<JobErrorAlertProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
      <AlertCircle className="size-5 shrink-0 mt-0.5" />
      <div className="text-sm font-medium break-words whitespace-pre-wrap">{error}</div>
    </div>
  );
};

export default JobErrorAlert;
