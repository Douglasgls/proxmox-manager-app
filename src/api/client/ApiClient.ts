import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

// URL base obtida do arquivo .env ou padrão
const BASE_URL = import.meta.env.VITE_API_URL;

// Variáveis de controle para o refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

// Função para processar a fila de requisições pendentes pós-refresh
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Instância base do Axios
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 segundos
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor de Requisição (Request) - Injeção do Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { token } = useAuthStore.getState();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Resposta (Response) - Captura de 401 e Refresh Token
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Retorna a resposta padrão
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Se o erro não for 401 ou se a requisição original já foi uma retentativa de refresh, propaga o erro
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Se a rota falhar na própria tentativa de login ou refresh token, propaga o erro diretamente para evitar loop
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Se já houver um processo de refresh em andamento, enfileira a requisição atual
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject: (err: any) => {
            reject(err);
          },
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const { refreshToken, setAuth, clearAuth } = useAuthStore.getState();

    if (!refreshToken) {
      clearAuth();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      // Faz requisição para atualizar o token. Nota: usamos a instância padrão do axios para não acionar interceptores
      const response = await axios.post(`${BASE_URL}auth/refresh`, {
        refreshToken,
      });

      const { token: newAccessToken, refreshToken: newRefreshToken, expiresIn, tokenType } = response.data.data;

      // Atualiza a store global
      setAuth(newAccessToken, newRefreshToken, expiresIn, tokenType);

      // Reprocessa a fila com o novo token
      processQueue(null, newAccessToken);

      // Atualiza o cabeçalho da requisição atual e a re-executa
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Se falhar o refresh token, limpa a sessão e redireciona para o login
      processQueue(refreshError, null);
      clearAuth();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Métodos auxiliares preparados para Upload e Download futuros
export const apiHelpers = {
  /**
   * Envio de arquivos multipart/form-data
   */
  upload: async <T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Download de arquivos (ex: ISOs, backups) como blob
   */
  download: async (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<Blob>> => {
    return apiClient.get<Blob>(url, {
      ...config,
      responseType: 'blob',
    });
  },
};
