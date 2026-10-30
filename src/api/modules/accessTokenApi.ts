import { apiClient } from '../client/ApiClient';

export interface AccessToken {
  id: string;
  token?: string; // Only returned on creation
  created_at: string;
  expires_at: string;
  active: boolean;
  last_used_at?: string | null;
  description?: string | null;
}


export interface ClientConnection {
  id: string;
  hostname: string | null;
  tailscale_ip: string | null;
  online: boolean;
  status: string;
  last_seen: string | null;
  created_at: string | null;
}

export interface CreateAccessTokenParams {
  expires_in_days?: number;
  expires_in_hours?: number;
  expires_in_minutes?: number;
  description?: string;
}

export const accessTokenApi = {
  list: async (containerId: string): Promise<AccessToken[]> => {
    const response = await apiClient.get<AccessToken[]>(`/containers/${containerId}/access-token`);
    return response.data;
  },

  create: async (containerId: string, params?: CreateAccessTokenParams): Promise<AccessToken> => {
    const response = await apiClient.post<AccessToken>(
      `/containers/${containerId}/access-token`,
      params || {}
    );
    return response.data;
  },

  revoke: async (tokenId: string): Promise<void> => {
    await apiClient.delete(`/access-token/${tokenId}`);
  },

  getConnections: async (containerId: string): Promise<ClientConnection[]> => {
    const response = await apiClient.get<ClientConnection[]>(`/containers/${containerId}/connections`);
    return response.data;
  },
};
