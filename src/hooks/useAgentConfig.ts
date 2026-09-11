import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentApi } from '@/api/modules/agentApi';
import { AGENT_STATUS_QUERY_KEY } from './useAgentStatus';
import { useToastStore } from '@/utils/clipboard';
import { extractErrorMessage } from '@/utils/error';
import type {
  ProxmoxConfigResponse,
  ProxmoxTestConnectionDTO,
  ProxmoxConfigDTO,
} from '@/types/agent';

export const AGENT_CONFIG_QUERY_KEY = ['agent', 'config'];

export const useAgentConfig = () => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  // Consulta configuração salva
  const configQuery = useQuery<ProxmoxConfigResponse>({
    queryKey: AGENT_CONFIG_QUERY_KEY,
    queryFn: () => agentApi.getConfig(),
    staleTime: 30000,
    retry: 1,
  });

  // Mutação para testar conexão (Passo 1)
  const testMutation = useMutation({
    mutationFn: (dto: ProxmoxTestConnectionDTO) => agentApi.testConnection(dto),
  });

  // Mutação para salvar configuração (Passo 2)
  const saveMutation = useMutation({
    mutationFn: (dto: ProxmoxConfigDTO) => {
      // Garante que o payload enviado à API tenha valores válidos e não omita campos obrigatórios
      const payload: ProxmoxConfigDTO = {
        ...dto,
        proxmox_token_value: dto.proxmox_token_value ?? '',
        default_storage: dto.default_storage ?? null,
        default_template: dto.default_template ?? null,
      };
      return agentApi.saveConfig(payload);
    },
    onSuccess: (_data, variables) => {
      // Atualiza cache de config preservando os dados já existentes
      queryClient.setQueryData<ProxmoxConfigResponse>(AGENT_CONFIG_QUERY_KEY, (old) => {
        if (!old) {
          return {
            configured: true,
            proxmox_host: variables.proxmox_host,
            proxmox_user: variables.proxmox_user,
            proxmox_token_name: variables.proxmox_token_name,
            proxmox_node: variables.proxmox_node,
            default_storage: variables.default_storage || null,
            default_template: variables.default_template || null,
          };
        }
        return {
          ...old,
          configured: true,
          proxmox_host: variables.proxmox_host || old.proxmox_host,
          proxmox_user: variables.proxmox_user || old.proxmox_user,
          proxmox_token_name: variables.proxmox_token_name || old.proxmox_token_name,
          proxmox_node: variables.proxmox_node || old.proxmox_node,
          default_storage:
            variables.default_storage !== undefined
              ? variables.default_storage
              : old.default_storage,
          default_template:
            variables.default_template !== undefined
              ? variables.default_template
              : old.default_template,
        };
      });

      // Invalida status do Agent para mudar para READY
      queryClient.invalidateQueries({ queryKey: AGENT_STATUS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: AGENT_CONFIG_QUERY_KEY });

      // Invalida consultas dependentes do Proxmox
      queryClient.invalidateQueries({ queryKey: ['host'] });
      queryClient.invalidateQueries({ queryKey: ['containers'] });
      queryClient.invalidateQueries({ queryKey: ['storages'] });
      queryClient.invalidateQueries({ queryKey: ['networks'] });
      queryClient.invalidateQueries({ queryKey: ['cloud'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });

      showToast(
        'Configuração do Proxmox VE gravada com sucesso! O Agent agora está pronto.',
        'success'
      );
    },
    onError: (error: any) => {
      const errorMsg = extractErrorMessage(error, 'Falha ao salvar configuração do Proxmox.');
      showToast(errorMsg, 'error');
    },
  });

  return {
    config: configQuery.data,
    isLoadingConfig: configQuery.isLoading,
    isErrorConfig: configQuery.isError,
    refetchConfig: configQuery.refetch,

    testConnection: testMutation.mutateAsync,
    isTesting: testMutation.isPending,
    testError: testMutation.error,
    testSuccess: testMutation.isSuccess,
    resetTest: testMutation.reset,

    saveConfig: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    saveSuccess: saveMutation.isSuccess,
  };
};

export default useAgentConfig;
