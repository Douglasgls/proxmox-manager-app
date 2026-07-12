import { apiClient } from '../client/ApiClient';
import type { ApiResponse } from '@/types/api';
import type { Container } from '@/types/container';

export const containerApi = {
  list: async (node?: string): Promise<ApiResponse<Container[]>> => {
    const response = await apiClient.get<ApiResponse<Container[]>>('/containers', {
      params: { node },
    });
    return response.data;
  },

  get: async (node: string, vmid: number): Promise<ApiResponse<Container>> => {
    const response = await apiClient.get<ApiResponse<Container>>(`/nodes/${node}/containers/${vmid}`);
    return response.data;
  },

  create: async (node: string, data: Partial<Container>): Promise<ApiResponse<{ vmid: number; upid: string }>> => {
    const response = await apiClient.post<ApiResponse<{ vmid: number; upid: string }>>(`/nodes/${node}/containers`, data);
    return response.data;
  },

  start: async (node: string, vmid: number): Promise<ApiResponse<{ upid: string }>> => {
    const response = await apiClient.post<ApiResponse<{ upid: string }>>(`/nodes/${node}/containers/${vmid}/status/start`);
    return response.data;
  },

  stop: async (node: string, vmid: number): Promise<ApiResponse<{ upid: string }>> => {
    const response = await apiClient.post<ApiResponse<{ upid: string }>>(`/nodes/${node}/containers/${vmid}/status/stop`);
    return response.data;
  },

  shutdown: async (node: string, vmid: number): Promise<ApiResponse<{ upid: string }>> => {
    const response = await apiClient.post<ApiResponse<{ upid: string }>>(`/nodes/${node}/containers/${vmid}/status/shutdown`);
    return response.data;
  },

  reboot: async (node: string, vmid: number): Promise<ApiResponse<{ upid: string }>> => {
    const response = await apiClient.post<ApiResponse<{ upid: string }>>(`/nodes/${node}/containers/${vmid}/status/reboot`);
    return response.data;
  },

  delete: async (node: string, vmid: number): Promise<ApiResponse<{ upid: string }>> => {
    const response = await apiClient.delete<ApiResponse<{ upid: string }>>(`/nodes/${node}/containers/${vmid}`);
    return response.data;
  },
};
