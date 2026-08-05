import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateApi, type DownloadTemplatePayload } from '@/api/modules/templateApi';

/**
 * Query hook para buscar templates LXC instalados no Proxmox.
 */
export const useInstalledTemplates = () => {
  return useQuery({
    queryKey: ['proxmox', 'templates', 'installed'],
    queryFn: templateApi.getInstalledTemplates,
    staleTime: 60 * 1000, // 1 minuto
  });
};

// Manter alias useTemplates para retrocompatibilidade
export const useTemplates = useInstalledTemplates;

/**
 * Query hook para buscar a lista de templates disponíveis para download.
 */
export const useAvailableTemplates = () => {
  return useQuery({
    queryKey: ['proxmox', 'templates', 'available'],
    queryFn: templateApi.getAvailableTemplates,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

/**
 * Mutation hook para realizar o download de um template.
 */
export const useDownloadTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DownloadTemplatePayload) => templateApi.downloadTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxmox', 'templates'] });
    },
  });
};

/**
 * Mutation hook para excluir um template do storage.
 */
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateName: string) => templateApi.deleteTemplate(templateName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxmox', 'templates'] });
    },
  });
};
