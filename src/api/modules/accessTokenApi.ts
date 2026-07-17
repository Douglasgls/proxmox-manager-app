import { apiClient } from '../client/ApiClient';

export interface AccessToken {
  id: string;
  token?: string; // Only returned on creation
  created_at: string;
  expires_at: string;
  active: boolean;
  last_used_at?: string | null;
}

export const accessTokenApi = {
  list: async (containerId: string): Promise<AccessToken[]> => {
    const response = await apiClient.get<AccessToken[]>(`/containers/${containerId}/access-token`);
    return response.data;
  },

  create: async (containerId: string): Promise<AccessToken> => {
    const response = await apiClient.post<AccessToken>(`/containers/${containerId}/access-token`);
    return response.data;
  },

  revoke: async (tokenId: string): Promise<void> => {
    await apiClient.delete(`/access-token/${tokenId}`);
  },
};
