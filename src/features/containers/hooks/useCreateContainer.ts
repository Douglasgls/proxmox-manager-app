import { useMutation } from '@tanstack/react-query';
import { containerCreateApi } from '../api/containerCreateApi';
import type { CreateContainerDTO } from '../types';

/**
 * Mutation hook para disparar a criação de um container LXC.
 * Retorna o job_id para que o componente inicie o tracking via WebSocket.
 */
export const useCreateContainer = () => {
  return useMutation({
    mutationFn: (dto: CreateContainerDTO) => containerCreateApi.create(dto),
  });
};
