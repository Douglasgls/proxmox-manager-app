import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/user';

interface AuthStateStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  tokenType: string | null;
  isAuthenticated: boolean;
  setAuth: (token: string, refreshToken: string, expiresIn: number, tokenType: string) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStateStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      expiresIn: null,
      tokenType: null,
      
      setAuth: (token, refreshToken, expiresIn, tokenType) =>
        set({ token, refreshToken, isAuthenticated: true, expiresIn, tokenType }),
      
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),

      clearAuth: () =>
        set({
          token: null, 
          refreshToken: null, 
          isAuthenticated: false, 
          expiresIn: null, 
          tokenType: null 
        }),
    }),
    {
      name: 'proxmox-auth-storage', // Nome da chave no localStorage
    }
  )
);
