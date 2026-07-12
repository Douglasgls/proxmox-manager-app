import { apiClient } from '../client/ApiClient';
import type { ApiResponse } from '@/types/api';
import type { Job } from '@/types/job';

export const jobApi = {
  list: async (node?: string, status?: string): Promise<ApiResponse<Job[]>> => {
    const response = await apiClient.get<ApiResponse<Job[]>>('/jobs', {
      params: { node, status },
    });
    return response.data;
  },

  get: async (node: string, upid: string): Promise<ApiResponse<Job>> => {
    const response = await apiClient.get<ApiResponse<Job>>(`/nodes/${node}/tasks/${upid}`);
    return response.data;
  },

  cancel: async (node: string, upid: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.post<ApiResponse<null>>(`/nodes/${node}/tasks/${upid}/cancel`);
    return response.data;
  },

  getLogs: async (node: string, upid: string, startLine?: number): Promise<ApiResponse<{ lines: string[]; total: number }>> => {
    const response = await apiClient.get<ApiResponse<{ lines: string[]; total: number }>>(`/nodes/${node}/tasks/${upid}/log`, {
      params: { startLine },
    });
    return response.data;
  },
};
