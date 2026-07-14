import { useQuery } from '@tanstack/react-query';
import { containerCreateApi } from '../api/containerCreateApi';

/**
 * Query hook para buscar templates LXC instalados no Proxmox.
 */
export const useTemplates = () => {
  return useQuery({
    queryKey: ['proxmox', 'templates', 'installed'],
    queryFn: containerCreateApi.getInstalledTemplates,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
