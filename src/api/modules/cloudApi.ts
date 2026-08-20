import { apiClient } from '../client/ApiClient';

export interface CloudStatusResponse {
  registered: boolean;
  connected: boolean;
  message?: string;
  jwt_valid?: boolean;
  registered_at?: string | null;
  last_ping?: string | null;
}

export interface CloudRegisterRequest {
  environment_token: string;
}

export interface CloudActionResponse {
  status: string;
  message: string;
}

export interface CloudNode {
  headscale_node_id?: string | null;
  machine_id?: string | null;
  cloud_connection_id?: string | null;
  tailscale_ip?: string | null;
  online: boolean;
  service_running: boolean;
  node_type: 'container' | 'client' | string;
  hostname?: string | null;
  container_id?: string | null;
  proxmox_container_id?: number | null;
  container_name?: string | null;
  last_sync?: string | null;
}

export interface CloudDetailsResponse {
  registered: boolean;
  connected: boolean;
  jwt_valid: boolean;
  cloud_environment_id?: string | null;
  cloud_url?: string | null;
  registered_at?: string | null;
  jwt_expires_at?: string | null;
  total_nodes: number;
  online_nodes: number;
  nodes: CloudNode[];
  message?: string;
}

export const cloudApi = {
  getStatus: async (): Promise<CloudStatusResponse> => {
    const response = await apiClient.get<CloudStatusResponse>('/cloud/status');
    return response.data;
  },

  getDetails: async (): Promise<CloudDetailsResponse> => {
    const response = await apiClient.get<CloudDetailsResponse>('/cloud/details');
    return response.data;
  },

  registerEnvironment: async (environment_token: string): Promise<CloudActionResponse> => {
    const response = await apiClient.post<CloudActionResponse>('/cloud/register', {
      environment_token,
    });
    return response.data;
  },

  reconnect: async (): Promise<CloudActionResponse> => {
    const response = await apiClient.post<CloudActionResponse>('/cloud/reconnect');
    return response.data;
  },
};
