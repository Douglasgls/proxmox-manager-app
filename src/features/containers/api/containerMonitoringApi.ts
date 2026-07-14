import { apiClient } from '@/api/client/ApiClient';
import type { ContainerInventory, ContainerMetrics, ContainerInventoryResponse, ContainerActionResponse } from '../types/index';

export const containerMonitoringApi = {
  getInventory: async (): Promise<ContainerInventoryResponse> => {
    const [inventoryResponse, containersResponse] = await Promise.all([
      apiClient.get<ContainerInventoryResponse>('/monitor/containers/inventory'),
      apiClient.get<any[]>('/containers')
    ]);

    const inventory = inventoryResponse.data;
    const containers = containersResponse.data;

    if (inventory && Array.isArray(inventory.containers) && Array.isArray(containers)) {
      inventory.containers = inventory.containers.map((container) => {
        const matchingContainer = containers.find(
          (c) => c.container_number === container.container_id
        );
        return {
          ...container,
          id: matchingContainer ? matchingContainer.id : '',
          ip_address: matchingContainer ? matchingContainer.ip_address : null,
        };
      });
    }

    return inventory;
  },

  getMetrics: async (): Promise<ContainerMetrics[]> => {
    const [metricsResponse, containersResponse] = await Promise.all([
      apiClient.get<ContainerMetrics[]>('/monitor/containers/metrics'),
      apiClient.get<any[]>('/containers')
    ]);

    const metrics = metricsResponse.data;
    const containers = containersResponse.data;

    if (Array.isArray(metrics) && Array.isArray(containers)) {
      return metrics.map((metric) => {
        const matchingContainer = containers.find(
          (c) => c.container_number === metric.container_id
        );
        return {
          ...metric,
          id: matchingContainer ? matchingContainer.id : '',
        };
      });
    }

    return metrics || [];
  },

  getInventoryById: async (id: number | string): Promise<ContainerInventory> => {
    let numericId = id;
    let uuid = '';
    let dbContainerData: any = null;
    if (typeof id === 'string' && id.includes('-')) {
      uuid = id;
      const dbContainerRes = await apiClient.get<any>(`/containers/${id}`);
      dbContainerData = dbContainerRes.data;
      numericId = dbContainerRes.data.container_number;
    } else {
      numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      const dbContainersRes = await apiClient.get<any[]>('/containers');
      const dbContainer = dbContainersRes.data.find(c => c.container_number === numericId);
      if (dbContainer) {
        uuid = dbContainer.id;
        dbContainerData = dbContainer;
      }
    }
    const response = await apiClient.get<ContainerInventory>(`/monitor/containers/${numericId}/inventory`);
    return {
      ...response.data,
      id: uuid,
      ip_address: dbContainerData ? dbContainerData.ip_address : null,
    };
  },

  getMetricsById: async (id: number | string): Promise<ContainerMetrics> => {
    let numericId = id;
    let uuid = '';
    if (typeof id === 'string' && id.includes('-')) {
      uuid = id;
      const dbContainerRes = await apiClient.get<any>(`/containers/${id}`);
      numericId = dbContainerRes.data.container_number;
    } else {
      numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      const dbContainersRes = await apiClient.get<any[]>('/containers');
      const dbContainer = dbContainersRes.data.find(c => c.container_number === numericId);
      if (dbContainer) {
        uuid = dbContainer.id;
      }
    }
    const response = await apiClient.get<ContainerMetrics>(`/monitor/containers/${numericId}/metrics`);
    return {
      ...response.data,
      id: uuid,
    };
  },

  start: async (id: number | string): Promise<ContainerActionResponse> => {
    const response = await apiClient.post<ContainerActionResponse>(`/containers/${id}/start`);
    return response.data;
  },

  stop: async (id: number | string): Promise<ContainerActionResponse> => {
    const response = await apiClient.post<ContainerActionResponse>(`/containers/${id}/stop`);
    return response.data;
  },

  restart: async (id: number | string): Promise<ContainerActionResponse> => {
    const response = await apiClient.post<ContainerActionResponse>(`/containers/${id}/restart`);
    return response.data;
  },
};
