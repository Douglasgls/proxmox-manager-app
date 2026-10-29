import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accessTokenApi, type CreateAccessTokenParams } from '@/api/modules/accessTokenApi';

export const useAccessTokens = (containerId: string) => {
  return useQuery({
    queryKey: ['access-tokens', containerId],
    queryFn: () => accessTokenApi.list(containerId),
    enabled: !!containerId,
  });
};

export type CreateAccessTokenVariables = 
  | string 
  | { containerId: string; params?: CreateAccessTokenParams };

export const useCreateAccessToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (variables: CreateAccessTokenVariables) => {
      if (typeof variables === 'string') {
        return accessTokenApi.create(variables);
      }
      return accessTokenApi.create(variables.containerId, variables.params);
    },
    onSuccess: (_, variables) => {
      const containerId = typeof variables === 'string' ? variables : variables.containerId;
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
