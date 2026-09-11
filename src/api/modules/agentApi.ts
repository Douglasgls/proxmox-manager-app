import { apiClient } from '../client/ApiClient';
import type {
  AgentStatusResponse,
  ProxmoxConfigResponse,
  ProxmoxTestConnectionDTO,
  ProxmoxConfigDTO,
  AgentActionResponse,
} from '@/types/agent';

export const agentApi = {
  /**
   * Consulta o status e a prontidão do Agent (READY ou NOT_CONFIGURED).
   */
  getStatus: async (): Promise<AgentStatusResponse> => {
    const response = await apiClient.get<AgentStatusResponse>('/agent/status');
    return response.data;
  },

  /**
   * Obtém a configuração atual do Proxmox VE gravada no Agent (sem dados sensíveis).
   */
  getConfig: async (): Promise<ProxmoxConfigResponse> => {
    const response = await apiClient.get<ProxmoxConfigResponse>('/agent/config');
    return response.data;
  },

  /**
   * Testa a conexão com o Proxmox VE sem gravar no banco de dados.
   */
  testConnection: async (dto: ProxmoxTestConnectionDTO): Promise<AgentActionResponse> => {
    const response = await apiClient.post<AgentActionResponse>('/agent/test-connection', dto);
    return response.data;
  },

  /**
   * Valida e grava a configuração do Proxmox VE no Agent.
   */
  saveConfig: async (dto: ProxmoxConfigDTO): Promise<ProxmoxConfigResponse> => {
    const response = await apiClient.post<ProxmoxConfigResponse>('/agent/config', dto);
    return response.data;
  },

  /**
   * Reinicia o servidor (Agent).
   */
  restartAgent: async (): Promise<AgentActionResponse> => {
    const response = await apiClient.post<AgentActionResponse>('/agent/restart');
    return response.data;
  },
};
