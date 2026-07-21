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

export const cloudApi = {
  getStatus: async (): Promise<CloudStatusResponse> => {
    const response = await apiClient.get<CloudStatusResponse>('/cloud/status');
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
