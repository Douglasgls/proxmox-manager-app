import { apiClient } from '../client/ApiClient';
import type { ApiResponse } from '@/types/api';
import type { HostInventory, HostMetrics, ProxmoxNode, StorageResource, NetworksResponse } from '@/types/inventory';

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

  getStorages: async (node?: string): Promise<StorageResource[]> => {
    const response = await apiClient.get<StorageResource[]>('/monitor/storage/inventory', {
      params: { node },
    });
    return response.data;
  },

  getNetworks: async (): Promise<NetworksResponse> => {
    const response = await apiClient.get<NetworksResponse>("/monitor/network/inventory");
    return response.data;
  },
};
