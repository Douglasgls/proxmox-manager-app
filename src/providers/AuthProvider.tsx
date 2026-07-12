import React, { createContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/modules/authApi';
import type { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, isAuthenticated, setAuth, clearAuth, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Validação da sessão ao inicializar o app
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Busca o perfil atualizado do usuário para testar o token atual
          const response = await authApi.getProfile();

          const userData = response.data || response;

          if (userData && (userData.id || userData.email || userData.id)) {
            updateUser(userData);
          } else {
            console.warn("Perfil vazio retornado pelo servidor.");
            // Só chame clearAuth se você tiver CERTEZA que o token expirou.
            // Geralmente deixamos o interceptor do Axios (erro 401) fazer o clearAuth.
          }


          // if (response.success && response.data) {
          //   updateUser(response.data);
          // } else {
          //   // Se a resposta indicar erro ou não houver dados
          //   clearAuth();
          // }
        } catch (error) {
          console.error('[Auth] Failed to initialize user session', error);
          // O ApiClient interceptor de 401 fará o refresh se necessário.
          // Se falhou aqui, o token pode estar inválido e o refresh também falhou.
          // Deixamos o fluxo seguir, mas não limpamos à força imediatamente
          // para dar chance ao interceptor de rodar o refresh no primeiro request.
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token, clearAuth, updateUser]);

  const login = async (email: string, password?: string) => {
    // setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });

      const payload = response.data || response;

      if (payload && payload.access_token) {

        setAuth(
          payload.access_token,
          payload.refresh_token,
          payload.expires_in,
          payload.token_type
        )
        refreshProfile();

      } else {
        throw new Error(response.message || 'Falha ao realizar login');
      }
    } catch (error) {
      clearAuth();
      throw error;
    } 
    // finally {
    //   setIsLoading(false);
    // }
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

  // const refreshProfile = async () => {
  //   try {
  //     const response = await authApi.getProfile();
  //     if (response.success && response.data) {
  //       updateUser(response.data);
  //     }
  //   } catch (error) {
  //     console.error('[Auth] Failed to refresh profile data', error);
  //   }
  // };

  const refreshProfile = async () => {
    try {
      const response = await authApi.getProfile();
      const userData = response.data || response;
      
      // Mesma lógica, se temos os dados brutos, salvamos.
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
