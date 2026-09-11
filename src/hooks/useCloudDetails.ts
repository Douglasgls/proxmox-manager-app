import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CloudConnectionService } from '@/services/cloudConnectionService';
import { CLOUD_STATUS_QUERY_KEY } from '@/components/cloud/useCloudConnection';
import { useNodeSync } from './websocket/useNodeSync';
import { filterDuplicateClientNodes } from '@/utils/cloudNodes';
import type { CloudDetailsResponse } from '@/api/modules/cloudApi';

export const CLOUD_DETAILS_QUERY_KEY = ['cloud', 'details'];

export const useCloudDetails = () => {
  const queryClient = useQueryClient();
  const nodeSync = useNodeSync();

  const detailsQuery = useQuery({
    queryKey: CLOUD_DETAILS_QUERY_KEY,
    queryFn: async () => {
      const details = await CloudConnectionService.getDetails();
      if (details && Array.isArray(details.nodes)) {
        const sanitizedNodes = filterDuplicateClientNodes(details.nodes);
        return {
          ...details,
          nodes: sanitizedNodes,
          total_nodes: sanitizedNodes.length,
          online_nodes: sanitizedNodes.filter((n) => n.online).length,
        };
      }
      return details;
    },
    select: (data: CloudDetailsResponse): CloudDetailsResponse => {
      if (data && Array.isArray(data.nodes)) {
        const sanitizedNodes = filterDuplicateClientNodes(data.nodes);
        return {
          ...data,
          nodes: sanitizedNodes,
          total_nodes: sanitizedNodes.length,
          online_nodes: sanitizedNodes.filter((n) => n.online).length,
        };
      }
      return data;
    },
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

    // Sincronização manual via WebSocket (node.sync)
    syncNodes: nodeSync.syncNodes,
    isSyncing: nodeSync.isSyncing,
    cooldownRemaining: nodeSync.cooldownRemaining,
    canSync: nodeSync.canSync,
    lastSyncTime: nodeSync.lastSyncTime,
  };
};

