import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useEnableRemoteAccess } from '../hooks';
import { JobProgressModal } from './JobProgressModal';
import { useQueryClient } from '@tanstack/react-query';

interface EnableRemoteAccessButtonProps {
  containerId: string | number;
  disabled?: boolean;
}

export const EnableRemoteAccessButton: React.FC<EnableRemoteAccessButtonProps> = ({
  containerId,
  disabled,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const enableMutation = useEnableRemoteAccess();

  const handleEnableAccess = async () => {
    try {
      const response = await enableMutation.mutateAsync(containerId);
      setJobId(response.job_id);
      setIsModalOpen(true);
    } catch (err) {
      console.error('[EnableRemoteAccess] Failed to start tailscale setup:', err);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setJobId(null);
  };

  const handleJobComplete = () => {
    // Invalidate inventory and metrics cache when setup is successful
    queryClient.invalidateQueries({ queryKey: ['containers', containerId] });
    // Also invalidate general container queries just in case
    queryClient.invalidateQueries({ queryKey: ['containers'] });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || enableMutation.isPending}
        onClick={handleEnableAccess}
        className="gap-2"
      >
        {enableMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ShieldCheck className="size-4" />
        )}
        Permitir acesso
      </Button>

      {isModalOpen && (
        <JobProgressModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          jobId={jobId}
          title="Configurando Acesso Remoto"
          description="Preparando o container e instalando Tailscale"
          onComplete={handleJobComplete}
          icon={<ShieldCheck className="size-4 text-primary" />}
        />
      )}
    </>
  );
};
