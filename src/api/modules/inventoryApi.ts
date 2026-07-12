import { apiClient } from '../client/ApiClient';
import type { ApiResponse } from '@/types/api';
import type { HostInventory, HostMetrics, ProxmoxNode, StorageResource, NetworkInterface } from '@/types/inventory';

export const inventoryApi = {
  getHost: async (): Promise<HostInventory> => {
    const response = await apiClient.get<HostInventory>('/monitor/host/inventory');
    return response.data;
  },

  getHostMetrics: async (): Promise<HostMetrics> => {
    const response = await apiClient.get<HostMetrics>('/monitor/host/metrics');
    return response.data;
  },


  nodes: async (): Promise<ApiResponse<ProxmoxNode[]>> => {
    const response = await apiClient.get<ApiResponse<ProxmoxNode[]>>('/nodes');
    return response.data;
  },

  storages: async (node?: string): Promise<ApiResponse<StorageResource[]>> => {
    const response = await apiClient.get<ApiResponse<StorageResource[]>>('/storages', {
      params: { node },
    });
    return response.data;
  },

  networks: async (node: string): Promise<ApiResponse<NetworkInterface[]>> => {
    const response = await apiClient.get<ApiResponse<NetworkInterface[]>>(`/nodes/${node}/network`);
    return response.data;
  },
};
