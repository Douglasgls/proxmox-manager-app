import { apiClient } from '@/api/client/ApiClient';
import type { CatalogComponent, ComponentItem, JobCreatedResponse } from '../types';

export const componentApi = {
  /**
   * Busca a lista de componentes ativos do catálogo.
   * Opcionalmente filtra por categoria (ex: 'database' ou 'programming_language').
   */
  getComponents: async (category?: string): Promise<CatalogComponent[]> => {
    const response = await apiClient.get<CatalogComponent[]>('/components', {
      params: category ? { category } : undefined,
    });
    return response.data;
  },

  /**
   * Dispara a instalação de novos componentes em um container LXC existente.
   */
  installComponents: async (containerId: string | number, components: ComponentItem[]): Promise<JobCreatedResponse> => {
    const response = await apiClient.post<JobCreatedResponse>(`/containers/${containerId}/components`, {
      components,
    });
    return response.data;
  },
};
