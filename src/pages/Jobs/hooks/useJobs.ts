import { useQuery } from '@tanstack/react-query';
import { jobsService } from '../services/jobsService';

/**
 * Hook para listar todos os jobs.
 * Refetch automático a cada 10 segundos para acompanhar jobs em execução.
 */
export const useJobsList = () => {
  return useQuery({
    queryKey: ['jobs', 'list'],
    queryFn: jobsService.list,
    refetchInterval: 10_000,
  });
};

/**
 * Hook para buscar detalhes de um job específico.
 * Habilitado apenas quando jobId não é null.
 */
export const useJobDetails = (jobId: string | null) => {
  return useQuery({
    queryKey: ['jobs', 'detail', jobId],
    queryFn: () => jobsService.getById(jobId!),
    enabled: !!jobId,
  });
};
