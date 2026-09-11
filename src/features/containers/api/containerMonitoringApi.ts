import { apiClient } from '@/api/client/ApiClient';
import type {
  ContainerInventory,
  ContainerMetrics,
  ContainerInventoryResponse,
  ContainerActionResponse,
  JobCreatedResponse,
} from '../types/index';

/**
 * Normaliza e extrai a lista de containers da resposta da API /containers
 * independentemente da camada de encapsulamento (direto, { data: [...] }, { containers: [...] }, etc).
 */
function extractContainerList(response: any): any[] | null {
  if (!response) return null;
  const data = response.data !== undefined ? response.data : response;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.containers)) return data.containers;
    if (Array.isArray(data.items)) return data.items;
  }
  return null;
}

/**
 * Cria um mapa de lookup rápido indexando todos os identificadores possíveis
 * (id UUID, container_number, vmid, container_id) em formato String.
 */
function buildContainerMap(dbList: any[]): Map<string, any> {
  const map = new Map<string, any>();
  for (const c of dbList) {
    if (!c) continue;
    if (c.id !== undefined && c.id !== null) {
      map.set(String(c.id), c);
    }
    if (c.container_number !== undefined && c.container_number !== null) {
      map.set(String(c.container_number), c);
    }
    if (c.vmid !== undefined && c.vmid !== null) {
      map.set(String(c.vmid), c);
    }
    if (c.container_id !== undefined && c.container_id !== null) {
      map.set(String(c.container_id), c);
    }
  }
  return map;
}

export const containerMonitoringApi = {
  getInventory: async (): Promise<ContainerInventoryResponse> => {
    const [inventoryResponse, containersResponse] = await Promise.all([
      apiClient.get<ContainerInventoryResponse>('/monitor/containers/inventory'),
      apiClient.get<any>('/containers').catch((err) => {
        console.warn('[containerMonitoringApi] Erro ao buscar /containers em getInventory', err);
        return null;
      }),
    ]);

    let inventory = inventoryResponse.data;
    if (
      inventory &&
      typeof inventory === 'object' &&
      !Array.isArray(inventory) &&
      (inventory as any).data &&
      Array.isArray((inventory as any).data.containers)
    ) {
      inventory = (inventory as any).data;
    }

    const dbList = extractContainerList(containersResponse);

    if (inventory && Array.isArray(inventory.containers)) {
      if (dbList !== null) {
        const dbMap = buildContainerMap(dbList);

        inventory.containers = inventory.containers
          .filter((container) => {
            const hasMatch =
              dbMap.has(String(container.container_id)) ||
              (container.id ? dbMap.has(String(container.id)) : false);
            return hasMatch;
          })
          .map((container) => {
            const matchingContainer =
              dbMap.get(String(container.container_id)) ||
              (container.id ? dbMap.get(String(container.id)) : null);
            return {
              ...container,
              id: matchingContainer?.id || container.id || String(container.container_id),
              ip_address: matchingContainer?.ip_address ?? matchingContainer?.ipAddress ?? null,
              components: matchingContainer?.components || [],
            };
          });

        inventory.total = inventory.containers.length;
        inventory.running = inventory.containers.filter((c) => c.status?.toLowerCase() === 'running').length;
        inventory.stopped = inventory.containers.filter((c) => c.status?.toLowerCase() === 'stopped').length;
        inventory.locked = inventory.containers.filter((c) => !!(c.locked || c.lock)).length;
        inventory.suspended = inventory.containers.filter((c) => c.status?.toLowerCase() === 'suspended').length;
      } else {
        // Fallback defensivo mantendo mapeamento padrão
        inventory.containers = inventory.containers.map((container) => ({
          ...container,
          id: container.id || String(container.container_id),
          ip_address: null,
          components: [],
        }));
      }
    }

    return inventory;
  },

  getMetrics: async (): Promise<ContainerMetrics[]> => {
    const [metricsResponse, containersResponse] = await Promise.all([
      apiClient.get<ContainerMetrics[]>('/monitor/containers/metrics'),
      apiClient.get<any>('/containers').catch((err) => {
        console.warn('[containerMonitoringApi] Erro ao buscar /containers em getMetrics', err);
        return null;
      }),
    ]);

    let metrics = metricsResponse.data;
    if (metrics && typeof metrics === 'object' && !Array.isArray(metrics) && Array.isArray((metrics as any).data)) {
      metrics = (metrics as any).data;
    }

    const dbList = extractContainerList(containersResponse);

    if (Array.isArray(metrics)) {
      if (dbList !== null) {
        const dbMap = buildContainerMap(dbList);

        return metrics
          .filter(
            (metric) =>
              dbMap.has(String(metric.container_id)) ||
              (metric.id ? dbMap.has(String(metric.id)) : false)
          )
          .map((metric) => {
            const matchingContainer =
              dbMap.get(String(metric.container_id)) ||
              (metric.id ? dbMap.get(String(metric.id)) : null);
            return {
              ...metric,
              id: matchingContainer?.id || metric.id || '',
            };
          });
      }
    }

    return metrics || [];
  },

  getInventoryById: async (id: number | string): Promise<ContainerInventory> => {
    let numericId: number | string = id;
    let uuid = '';
    let dbContainerData: any = null;

    if (typeof id === 'string' && id.includes('-')) {
      uuid = id;
      try {
        const dbContainerRes = await apiClient.get<any>(`/containers/${id}`);
        const raw = dbContainerRes.data;
        dbContainerData = raw && raw.data ? raw.data : raw;
        numericId = dbContainerData?.container_number ?? dbContainerData?.vmid ?? dbContainerData?.container_id ?? id;
      } catch (e) {
        console.warn(`[getInventoryById] Could not fetch DB container for uuid ${id}`, e);
      }
    } else {
      numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      try {
        const dbContainersRes = await apiClient.get<any>('/containers');
        const dbList = extractContainerList(dbContainersRes) || [];
        const dbMap = buildContainerMap(dbList);
        const match = dbMap.get(String(numericId));
        if (match) {
          uuid = match.id;
          dbContainerData = match;
        }
      } catch (e) {
        console.warn(`[getInventoryById] Could not fetch /containers list`, e);
      }
    }

    const response = await apiClient.get<ContainerInventory>(`/monitor/containers/${numericId}/inventory`);
    let rawInv = response.data;
    if (rawInv && typeof rawInv === 'object' && !Array.isArray(rawInv) && (rawInv as any).data) {
      rawInv = (rawInv as any).data;
    }

    return {
      ...rawInv,
      id: uuid || rawInv?.id || String(numericId),
      ip_address: dbContainerData ? (dbContainerData.ip_address ?? dbContainerData.ipAddress) : (rawInv?.ip_address ?? null),
      components: dbContainerData ? (dbContainerData.components || []) : (rawInv?.components || []),
    };
  },

  getMetricsById: async (id: number | string): Promise<ContainerMetrics> => {
    let numericId: number | string = id;
    let uuid = '';

    if (typeof id === 'string' && id.includes('-')) {
      uuid = id;
      try {
        const dbContainerRes = await apiClient.get<any>(`/containers/${id}`);
        const raw = dbContainerRes.data;
        const dbContainerData = raw && raw.data ? raw.data : raw;
        numericId = dbContainerData?.container_number ?? dbContainerData?.vmid ?? dbContainerData?.container_id ?? id;
      } catch (e) {
        console.warn(`[getMetricsById] Could not fetch DB container for uuid ${id}`, e);
      }
    } else {
      numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      try {
        const dbContainersRes = await apiClient.get<any>('/containers');
        const dbList = extractContainerList(dbContainersRes) || [];
        const dbMap = buildContainerMap(dbList);
        const match = dbMap.get(String(numericId));
        if (match) {
          uuid = match.id;
        }
      } catch (e) {
        console.warn(`[getMetricsById] Could not fetch /containers list`, e);
      }
    }

    const response = await apiClient.get<ContainerMetrics>(`/monitor/containers/${numericId}/metrics`);
    let rawMetrics = response.data;
    if (rawMetrics && typeof rawMetrics === 'object' && !Array.isArray(rawMetrics) && (rawMetrics as any).data) {
      rawMetrics = (rawMetrics as any).data;
    }

    return {
      ...rawMetrics,
      id: uuid || rawMetrics?.id || '',
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

  delete: async (id: number | string): Promise<ContainerActionResponse> => {
    const response = await apiClient.delete<ContainerActionResponse>(`/containers/${id}`);
    return response.data;
  },

  setupTailscale: async (id: number | string): Promise<JobCreatedResponse> => {
    const response = await apiClient.post<JobCreatedResponse>(`/containers/${id}/tailscale/setup`);
    return response.data;
  },
};
