import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accessTokenApi } from '@/api/modules/accessTokenApi';

export const useAccessTokens = (containerId: string) => {
  return useQuery({
    queryKey: ['access-tokens', containerId],
    queryFn: () => accessTokenApi.list(containerId),
    enabled: !!containerId,
  });
};

export const useCreateAccessToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (containerId: string) => accessTokenApi.create(containerId),
    onSuccess: (_, containerId) => {
      queryClient.invalidateQueries({ queryKey: ['access-tokens', containerId] });
    },
  });
};

export const useRevokeAccessToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tokenId }: { tokenId: string; containerId: string }) => 
      accessTokenApi.revoke(tokenId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['access-tokens', variables.containerId] });
    },
  });
};
