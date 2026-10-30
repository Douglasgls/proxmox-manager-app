import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { useProxmoxErrorStore } from '@/stores/proxmoxErrorStore';
import { useToastStore } from '@/utils/clipboard';

// URL base obtida do arquivo .env ou padrão
const BASE_URL = import.meta.env.VITE_API_URL;

// Variáveis de controle para o refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

// Controle de debounce para notificações de erro do Proxmox via toast
let lastProxmoxToastTime = 0;
const notifyProxmoxToast = (message: string) => {
  const now = Date.now();
  if (now - lastProxmoxToastTime > 6000) {
    lastProxmoxToastTime = now;
    useToastStore.getState().showToast(message, 'error');
  }
};

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

// Interceptor de Resposta (Response) - Captura de erros do Proxmox, 401 e Refresh Token
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Se a requisição de monitoramento ou nós tiver sucesso, limpa eventuais erros prévios do Proxmox
    if (
      (response.config.url?.includes('/monitor/') || response.config.url?.includes('/nodes')) &&
      useProxmoxErrorStore.getState().error
    ) {
      useProxmoxErrorStore.getState().clearError();
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const responseData = error.response?.data;

    // Captura erros de permissão ou conectividade do Proxmox VE
    if (error.response) {
      const status = error.response.status;
      const errorCode = responseData?.error_code;
      const isPermError =
        status === 403 &&
        (errorCode === 'PROXMOX_PERMISSION_DENIED' ||
          (typeof responseData?.detail === 'string' &&
            responseData.detail.includes('Permissão insuficiente no Proxmox')));

      const isConnError =
        (status === 502 || status === 503) &&
        (errorCode === 'PROXMOX_CONNECTION_ERROR' ||
          (typeof responseData?.detail === 'string' &&
            responseData.detail.includes('Falha na comunicação com o Proxmox')));

      if (isPermError) {
        const detailMsg =
          responseData?.detail ||
          'Permissão insuficiente no Proxmox VE para executar esta ação.';

        useProxmoxErrorStore.getState().setError({
          errorCode: 'PROXMOX_PERMISSION_DENIED',
          detail: detailMsg,
          requiredPermission: responseData?.required_permission || null,
          path: responseData?.path || null,
          rawMessage: responseData?.raw_message,
          timestamp: Date.now(),
        });

        notifyProxmoxToast(detailMsg);
      } else if (isConnError) {
        useProxmoxErrorStore.getState().setError({
          errorCode: 'PROXMOX_CONNECTION_ERROR',
          detail: responseData?.detail || 'Falha na comunicação com o Proxmox VE.',
          timestamp: Date.now(),
        });
      }
    }

    // Se o erro não for 401 ou se a requisição original já foi uma retentativa de refresh, propaga o erro
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Se a rota falhar na própria tentativa de login, registro ou refresh token, propaga o erro diretamente para evitar loop
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/users')) {
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
        refresh_token: refreshToken,
      });

      const {
        access_token,
        refresh_token,
        expires_in,
        token_type,
      } = response.data;

      setAuth(
        access_token,
        refresh_token,
        expires_in,
        token_type
      );
      
      // Reprocessa a fila com o novo token
      processQueue(null, access_token);

      // Atualiza o cabeçalho da requisição atual e a re-executa
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
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
