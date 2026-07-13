import { useChannel } from './useChannel';
import type { ContainerMetrics } from '@/features/containers/types/index';

export const useContainersMetrics = () => {
  return useChannel<ContainerMetrics[]>('containers.metrics');
};
