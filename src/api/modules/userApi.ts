import { apiClient } from '../client/ApiClient';

export interface CreateUserPayload {
  username: string;
  email: string;
  password?: string;
  role: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const userApi = {
  registerUser: async (payload: CreateUserPayload): Promise<UserResponse> => {
    const response = await apiClient.post<UserResponse>('/users', payload);
    return response.data;
  },
};
