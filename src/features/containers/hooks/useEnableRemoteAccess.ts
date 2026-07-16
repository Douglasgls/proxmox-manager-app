import { useMutation } from '@tanstack/react-query';
import { containerMonitoringApi } from '../api/containerMonitoringApi';

export const useEnableRemoteAccess = () => {
  return useMutation({
    mutationFn: (containerId: string | number) => containerMonitoringApi.setupTailscale(containerId),
  });
};
