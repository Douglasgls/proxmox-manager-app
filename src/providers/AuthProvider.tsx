import React, { createContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/modules/authApi';
import type { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, refreshToken, expiresIn, isAuthenticated, setAuth, clearAuth, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Validação da sessão ao inicializar o app
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Busca o perfil atualizado do usuário para testar o token atual
          const response = await authApi.getProfile();

          const userData = response.data || response;

          if (userData && (userData.id || userData.email)) {
            updateUser(userData);
          } else {
            console.warn("Perfil vazio retornado pelo servidor.");
          }
        } catch (error) {
          console.error('[Auth] Failed to initialize user session', error);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token, clearAuth, updateUser]);

  // Renovação periódica do token em background antes de expirar
  useEffect(() => {
    if (!token || !refreshToken) return;

    // Se expiresIn for 900s (15 min), renova 60s antes (14 min)
    const refreshDelay = expiresIn
      ? Math.max((expiresIn - 60) * 1000, 30000)
      : 14 * 60 * 1000;

    const timer = setTimeout(async () => {
      try {
        const response = await authApi.refreshToken(refreshToken);
        const data = (response as any).data || response;
        if (data?.access_token) {
          setAuth(
            data.access_token,
            data.refresh_token,
            data.expires_in,
            data.token_type
          );
        }
      } catch (err) {
        console.warn('[Auth] Falha no refresh proativo do token:', err);
      }
    }, refreshDelay);

    return () => clearTimeout(timer);
  }, [token, refreshToken, expiresIn, setAuth]);

  const login = async (email: string, password?: string, rememberMe: boolean = false) => {
    try {
      const response = await authApi.login({ email, password });

      const payload = (response as any).data || response;

      if (payload && payload.access_token) {
        setAuth(
          payload.access_token,
          payload.refresh_token,
          payload.expires_in,
          payload.token_type,
          rememberMe
        );
        refreshProfile();
      } else {
        throw new Error((response as any).message || 'Falha ao realizar login');
      }
    } catch (error) {
      clearAuth();
      throw error;
    } 
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('[Auth] Logout API call failed, clearing session locally', error);
    } finally {
      clearAuth();
      setIsLoading(false);
      window.location.href = '/login';
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await authApi.getProfile();
      const userData = response.data || response;
      
      if (userData) {
        updateUser(userData);
      }
    } catch (error) {
      console.error('[Auth] Failed to refresh profile data', error);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
