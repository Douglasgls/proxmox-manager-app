import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CloudConnectionService } from '@/services/cloudConnectionService';

export const CLOUD_STATUS_QUERY_KEY = ['cloud', 'status'];

export const useCloudConnection = () => {
  const queryClient = useQueryClient();

  // Consulta de status com polling leve de 12 segundos (entre 10 e 15s)
  const statusQuery = useQuery({
    queryKey: CLOUD_STATUS_QUERY_KEY,
    queryFn: () => CloudConnectionService.getStatus(),
    refetchInterval: 12000, // 12s polling
    staleTime: 5000,
  });

  // Mutation para registrar environment token
  const registerMutation = useMutation({
    mutationFn: (token: string) => CloudConnectionService.registerEnvironment(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLOUD_STATUS_QUERY_KEY });
    },
  });

  // Mutation para reconectar
  const reconnectMutation = useMutation({
    mutationFn: () => CloudConnectionService.reconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLOUD_STATUS_QUERY_KEY });
    },
  });

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    error: statusQuery.error,
    refetchStatus: statusQuery.refetch,

    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,

    reconnect: reconnectMutation.mutateAsync,
    isReconnecting: reconnectMutation.isPending,
    reconnectError: reconnectMutation.error,
  };
};
