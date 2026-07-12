import { apiClient } from '../client/ApiClient';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/user';

export interface LoginResponseData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string; 
}

export const authApi = {
  login: async (credentials: { email: string; password?: string }): Promise<ApiResponse<LoginResponseData>> => {
    const response = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/logout');
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<LoginResponseData>> => {
    const response = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/refresh', { refreshToken });
    return response.data;
  },
};
