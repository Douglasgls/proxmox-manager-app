import { apiClient } from '../client/ApiClient';
import type { TemplateImage, ContainerJobStatus } from '@/features/containers/types';

export interface DownloadTemplatePayload {
  storage: string;
  template: string;
}

export const templateApi = {
  /**
   * Lista todos os templates LXC disponíveis no repositório Proxmox.
   */
  getAvailableTemplates: async (): Promise<TemplateImage[]> => {
    const response = await apiClient.get<TemplateImage[]>('/proxmox/templates/available');
    return response.data;
  },

  /**
   * Lista todos os templates LXC atualmente instalados no storage do Proxmox.
   */
  getInstalledTemplates: async (): Promise<TemplateImage[]> => {
    const response = await apiClient.get<TemplateImage[]>('/proxmox/templates/installed');
    return response.data;
  },

  /**
   * Inicia o download de um template para o storage especificado.
   * Retorna os dados do job para acompanhamento em tempo real.
   */
  downloadTemplate: async (payload: DownloadTemplatePayload): Promise<{ id: string } & Partial<ContainerJobStatus>> => {
    const response = await apiClient.post('/proxmox/templates/download', payload);
    return response.data;
  },

  /**
   * Remove um template do storage do Proxmox.
   */
  deleteTemplate: async (templateName: string): Promise<TemplateImage> => {
    const encodedName = encodeURIComponent(templateName);
    const response = await apiClient.delete<TemplateImage>(`/proxmox/templates/${encodedName}`);
    return response.data;
  },
};
