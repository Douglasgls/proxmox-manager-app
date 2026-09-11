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

import type { ContainerInventoryResponse } from '../types/index';
import { useToastStore } from '@/utils/clipboard';

export const useDeleteContainer = () => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  return useMutation({
    mutationFn: (id: number | string) => containerMonitoringApi.delete(id),
    onMutate: async (id: number | string) => {
      // Cancel ongoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['containers', 'inventory'] });
      await queryClient.cancelQueries({ queryKey: ['containers', 'metrics'] });

      // Snapshot previous value
      const previousInventory = queryClient.getQueryData<ContainerInventoryResponse>(['containers', 'inventory']);

      // Optimistically remove container from list
      if (previousInventory?.containers) {
        queryClient.setQueryData<ContainerInventoryResponse>(['containers', 'inventory'], {
          ...previousInventory,
          containers: previousInventory.containers.filter(
            (c) => c.id !== id && String(c.id) !== String(id) && String(c.container_id) !== String(id)
          ),
          total: Math.max(0, (previousInventory.total ?? previousInventory.containers.length) - 1),
        });
      }

      return { previousInventory };
    },
    onError: (_err, _id, context) => {
      if (context?.previousInventory) {
        queryClient.setQueryData(['containers', 'inventory'], context.previousInventory);
      }
      showToast('Erro ao excluir container.', 'error');
    },
    onSuccess: (_data, id) => {
      // Ensure the container is removed from any container cache
      queryClient.setQueryData<ContainerInventoryResponse>(['containers', 'inventory'], (prev) => {
        if (!prev?.containers) return prev;
        return {
          ...prev,
          containers: prev.containers.filter(
            (c) => c.id !== id && String(c.id) !== String(id) && String(c.container_id) !== String(id)
          ),
          total: Math.max(0, (prev.total ?? prev.containers.length) - 1),
        };
      });

      // Remove specific container queries from cache
      queryClient.removeQueries({ queryKey: ['containers', id] });
      queryClient.removeQueries({ queryKey: ['containers', String(id)] });

      // Invalidate queries to sync with backend
      queryClient.invalidateQueries({ queryKey: ['containers', 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['containers', 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['containers'] });

      showToast('Container excluído com sucesso!', 'success');
    },
  });
};

export { useCreateContainer } from './useCreateContainer';
export { useJobChannel } from './useJobChannel';
export {
  useTemplates,
  useInstalledTemplates,
  useAvailableTemplates,
  useDownloadTemplate,
  useDeleteTemplate,
} from './useTemplates';
export { useBridges } from './useBridges';
export * from './useAccessTokens';
export { useEnableRemoteAccess } from './useEnableRemoteAccess';
export { useCatalogComponents, useInstallComponents } from './useCatalogComponents';

