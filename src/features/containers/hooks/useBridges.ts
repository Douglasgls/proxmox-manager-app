import { useQuery } from '@tanstack/react-query';
import { containerCreateApi } from '../api/containerCreateApi';

/**
 * Query hook para buscar as bridges de rede do Proxmox.
 */
export const useBridges = () => {
  return useQuery({
    queryKey: ['proxmox', 'networks'],
    queryFn: containerCreateApi.getBridges,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
