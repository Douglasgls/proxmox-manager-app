import { useQuery } from '@tanstack/react-query';
import { agentApi } from '@/api/modules/agentApi';
import type { AgentStatusResponse } from '@/types/agent';

export const AGENT_STATUS_QUERY_KEY = ['agent', 'status'];

export const useAgentStatus = () => {
  const query = useQuery<AgentStatusResponse>({
    queryKey: AGENT_STATUS_QUERY_KEY,
    queryFn: () => agentApi.getStatus(),
    refetchInterval: (query) => {
      // Se não estiver configurado, checa a cada 10s para refletir assim que configurar
      const data = query.state.data;
      if (data?.readiness === 'NOT_CONFIGURED') {
        return 10000;
      }
      return 60000;
    },
    staleTime: 5000,
    retry: 2,
  });

  const readiness = query.data?.readiness || 'READY';
  const isReady = readiness === 'READY';
  const isNotConfigured = readiness === 'NOT_CONFIGURED';

  return {
    ...query,
    readiness,
    isReady,
    isNotConfigured,
    version: query.data?.version || '',
    agentStatusText: query.data?.agent_status || '',
  };
};

export default useAgentStatus;
