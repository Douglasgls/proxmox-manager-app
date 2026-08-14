import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { componentApi } from '../api/componentApi';
import type { CatalogComponent, ComponentItem } from '../types';

/**
 * Hook para buscar a lista de componentes disponíveis no catálogo.
 */
export const useCatalogComponents = (category?: string) => {
  return useQuery<CatalogComponent[]>({
    queryKey: ['components', category ?? 'all'],
    queryFn: () => componentApi.getComponents(category),
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });
};

/**
 * Mutation hook para disparar a instalação de novos componentes em um container LXC.
 */
export const useInstallComponents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ containerId, components }: { containerId: string | number; components: ComponentItem[] }) =>
      componentApi.installComponents(containerId, components),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['containers', variables.containerId] });
      queryClient.invalidateQueries({ queryKey: ['containers', 'inventory'] });
    },
  });
};
