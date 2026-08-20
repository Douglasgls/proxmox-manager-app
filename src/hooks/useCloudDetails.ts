import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CloudConnectionService } from '@/services/cloudConnectionService';
import { CLOUD_STATUS_QUERY_KEY } from '@/components/cloud/useCloudConnection';

export const CLOUD_DETAILS_QUERY_KEY = ['cloud', 'details'];

export const useCloudDetails = () => {
  const queryClient = useQueryClient();

  const detailsQuery = useQuery({
    queryKey: CLOUD_DETAILS_QUERY_KEY,
    queryFn: () => CloudConnectionService.getDetails(),
    refetchInterval: 15000, // Polling a cada 15 segundos
    staleTime: 8000,
  });

  const reconnectMutation = useMutation({
    mutationFn: () => CloudConnectionService.reconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLOUD_DETAILS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: CLOUD_STATUS_QUERY_KEY });
    },
  });

  return {
    data: detailsQuery.data,
    isLoading: detailsQuery.isLoading,
    isFetching: detailsQuery.isFetching,
    isError: detailsQuery.isError,
    error: detailsQuery.error,
    refetch: detailsQuery.refetch,

    reconnect: reconnectMutation.mutateAsync,
    isReconnecting: reconnectMutation.isPending,
    reconnectError: reconnectMutation.error,
  };
};
