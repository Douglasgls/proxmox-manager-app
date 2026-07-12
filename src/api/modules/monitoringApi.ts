import { apiClient } from '../client/ApiClient';
import type { ApiResponse } from '@/types/api';
import type { HostMetrics, MetricPoint } from '@/types/metrics';

export const monitoringApi = {
  hostMetrics: async (node: string): Promise<ApiResponse<HostMetrics>> => {
    const response = await apiClient.get<ApiResponse<HostMetrics>>(`/nodes/${node}/status`);
    return response.data;
  },

  containerMetrics: async (node: string, vmid: number): Promise<ApiResponse<HostMetrics>> => {
    const response = await apiClient.get<ApiResponse<HostMetrics>>(`/nodes/${node}/containers/${vmid}/status`);
    return response.data;
  },

  nodeHistory: async (node: string, range?: string): Promise<ApiResponse<MetricPoint[]>> => {
    const response = await apiClient.get<ApiResponse<MetricPoint[]>>(`/nodes/${node}/rrddata`, {
      params: { range },
    });
    return response.data;
  },

  containerHistory: async (node: string, vmid: number, range?: string): Promise<ApiResponse<MetricPoint[]>> => {
    const response = await apiClient.get<ApiResponse<MetricPoint[]>>(`/nodes/${node}/containers/${vmid}/rrddata`, {
      params: { range },
    });
    return response.data;
  },
};
