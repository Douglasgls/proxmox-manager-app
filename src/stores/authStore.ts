import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { User } from '@/types/user';
import { STORAGE_KEYS } from '@/utils/constants';

interface AuthStateStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  tokenType: string | null;
  rememberMe: boolean;
  isAuthenticated: boolean;
  setAuth: (
    token: string,
    refreshToken: string,
    expiresIn: number,
    tokenType: string,
    rememberMe?: boolean
  ) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
}

/**
 * Adaptador de armazenamento dinâmico para alternar entre
 * localStorage (Lembrar-me ativado) e sessionStorage (Sessão temporária).
 */
const dynamicAuthStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      // 1. Prioriza a sessão temporária se existir
      const sessionValue = sessionStorage.getItem(name);
      if (sessionValue) {
        return sessionValue;
      }
      // 2. Se não estiver em sessionStorage, busca no localStorage
      return localStorage.getItem(name);
    } catch (e) {
      console.warn('[AuthStorage] Erro ao ler storage:', e);
      return null;
    }
  },

  setItem: (name: string, value: string): void => {
    try {
      let isRemember = false;
      try {
        const parsed = JSON.parse(value);
        isRemember = Boolean(parsed?.state?.rememberMe);
      } catch {
        isRemember = false;
      }

      if (isRemember) {
        // Sessão persistente: salva em localStorage e remove resquícios de sessionStorage
        localStorage.setItem(name, value);
        sessionStorage.removeItem(name);
      } else {
        // Sessão temporária: salva em sessionStorage e remove de localStorage
        sessionStorage.setItem(name, value);
        localStorage.removeItem(name);
      }
    } catch (e) {
      console.warn('[AuthStorage] Erro ao gravar storage:', e);
    }
  },

  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
      sessionStorage.removeItem(name);
    } catch (e) {
      console.warn('[AuthStorage] Erro ao limpar storage:', e);
    }
  },
};

export const useAuthStore = create<AuthStateStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      expiresIn: null,
      tokenType: null,
      rememberMe: false,

      setAuth: (token, refreshToken, expiresIn, tokenType, rememberMe) =>
        set((state) => ({
          token,
          refreshToken,
          isAuthenticated: true,
          expiresIn,
          tokenType,
          rememberMe: rememberMe !== undefined ? rememberMe : state.rememberMe,
        })),

      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),

      clearAuth: () => {
        try {
          localStorage.removeItem(STORAGE_KEYS.AUTH);
          sessionStorage.removeItem(STORAGE_KEYS.AUTH);
        } catch {}
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          expiresIn: null,
          tokenType: null,
          rememberMe: false,
        });
      },
    }),
    {
      name: STORAGE_KEYS.AUTH,
      storage: createJSONStorage(() => dynamicAuthStorage),
    }
  )
);
