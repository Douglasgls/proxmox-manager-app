import { useChannel } from './useChannel';
import type { ContainerMetrics } from '@/features/containers/types/index';

export const useContainerMetrics = (containerId: number | string | null | undefined) => {
  const channel = containerId !== undefined && containerId !== null && containerId !== ''
    ? `containers.${containerId}.metrics`
    : null;
  return useChannel<ContainerMetrics>(channel);
};
