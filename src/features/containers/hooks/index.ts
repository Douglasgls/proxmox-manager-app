import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { containerMonitoringApi } from '../api/containerMonitoringApi';

export const useContainerInventory = () => {
  return useQuery({
    queryKey: ['containers', 'inventory'],
    queryFn: containerMonitoringApi.getInventory,
  });
};

export const useContainerMetrics = () => {
  return useQuery({
    queryKey: ['containers', 'metrics'],
    queryFn: containerMonitoringApi.getMetrics,
  });
};

export const useContainerInventoryById = (id: number | string) => {
  return useQuery({
    queryKey: ['containers', id, 'inventory'],
    queryFn: () => containerMonitoringApi.getInventoryById(id),
    enabled: id !== undefined && id !== null && id !== '',
  });
};

export const useContainerMetricsById = (id: number | string) => {
  return useQuery({
    queryKey: ['containers', id, 'metrics'],
    queryFn: () => containerMonitoringApi.getMetricsById(id),
    enabled: id !== undefined && id !== null && id !== '',
  });
};

export const useStartContainer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => containerMonitoringApi.start(id),
    onSuccess: () => {
      // Invalidate both inventory and metrics
      queryClient.invalidateQueries({ queryKey: ['containers'] });
    },
  });
};

export const useStopContainer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => containerMonitoringApi.stop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
    },
  });
};

export const useRestartContainer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => containerMonitoringApi.restart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
    },
  });
};

export const useDeleteContainer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => containerMonitoringApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
    },
  });
};

export { useCreateContainer } from './useCreateContainer';
export { useJobChannel } from './useJobChannel';
export { useTemplates } from './useTemplates';
export { useBridges } from './useBridges';

