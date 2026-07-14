import { apiClient } from '@/api/client/ApiClient';
import type { CreateContainerDTO, JobCreatedResponse, TemplateImage } from '../types';

export const containerCreateApi = {
  /**
   * Dispara a criação de um container LXC.
   * Retorna imediatamente com o job_id (HTTP 202 Accepted).
   */
  create: async (dto: CreateContainerDTO): Promise<JobCreatedResponse> => {
    const response = await apiClient.post<JobCreatedResponse>('/containers', dto);
    return response.data;
  },

  /**
   * Busca templates de imagens LXC instalados no Proxmox.
   */
  getInstalledTemplates: async (): Promise<TemplateImage[]> => {
    const response = await apiClient.get<TemplateImage[]>('/proxmox/templates/installed');
    return response.data;
  },
  /**
   * Busca as bridges de rede do Proxmox.
   */
  getBridges: async (): Promise<{ name: string; active: boolean }[]> => {
    const response = await apiClient.get<{ name: string; active: boolean }[]>('/proxmox/networks');
    return response.data;
  },
};
