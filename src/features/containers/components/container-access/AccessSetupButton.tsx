import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Key } from 'lucide-react';
import { useEnableRemoteAccess } from '../../hooks';
import { JobProgressModal } from '../JobProgressModal';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateAccessToken, useAccessTokens } from '../../hooks';
import { AccessTokenDialog } from './AccessTokenDialog';
import { AccessManagementDialog } from './AccessManagementDialog';

interface AccessSetupButtonProps {
  containerId: string | number;
  disabled?: boolean;
}

export const AccessSetupButton: React.FC<AccessSetupButtonProps> = ({
  containerId,
  disabled,
}) => {
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [newTokenData, setNewTokenData] = useState<{ token: string; expiresAt: string } | null>(null);
  
  const queryClient = useQueryClient();
  const enableMutation = useEnableRemoteAccess();
  const createTokenMutation = useCreateAccessToken();
  
  const containerIdStr = String(containerId);
  
  // Use tokens to know if remote access is already set up. 
  // If we can fetch them successfully, it means the API is responding (even if empty).
  // Alternatively, we could just show "Gerenciar acessos" if tokens.length > 0.
  const { data: tokens, isSuccess } = useAccessTokens(containerIdStr);
  const hasTokens = isSuccess && tokens && tokens.length > 0;

  const handleEnableAccess = async () => {
    try {
      const response = await enableMutation.mutateAsync(containerId);
      setJobId(response.job_id);
      setIsJobModalOpen(true);
    } catch (err) {
      console.error('[EnableRemoteAccess] Failed to start tailscale setup:', err);
    }
  };

  const handleJobModalClose = () => {
    setIsJobModalOpen(false);
    setJobId(null);
  };

  const handleJobComplete = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ['containers', containerId] });
    queryClient.invalidateQueries({ queryKey: ['containers'] });
    
    // Automatic token generation upon completion
    try {
      const response = await createTokenMutation.mutateAsync(containerIdStr);
      if (response.token) {
        setNewTokenData({
          token: response.token,
          expiresAt: response.expires_at,
        });
      }
    } catch (err) {
      console.error('Failed to generate automatic token after job complete:', err);
    }
  }, [containerId, containerIdStr, queryClient, createTokenMutation]);

  return (
    <>
      {!hasTokens ? (
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || enableMutation.isPending || createTokenMutation.isPending}
          onClick={handleEnableAccess}
          className="gap-2"
        >
          {(enableMutation.isPending || createTokenMutation.isPending) ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}
          Permitir acesso
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => setIsManagementOpen(true)}
          className="gap-2"
        >
          <Key className="size-4" />
          Gerenciar acessos
        </Button>
      )}

      {isJobModalOpen && (
        <JobProgressModal
          isOpen={isJobModalOpen}
          onClose={handleJobModalClose}
          jobId={jobId}
          title="Configurando Acesso Remoto"
          description="Preparando o container e instalando dependências (Tailscale)"
          onComplete={handleJobComplete}
          icon={<ShieldCheck className="size-4 text-primary" />}
        />
      )}

      {newTokenData && (
        <AccessTokenDialog
          isOpen={!!newTokenData}
          onClose={() => setNewTokenData(null)}
          token={newTokenData.token}
          expiresAt={newTokenData.expiresAt}
        />
      )}

      <AccessManagementDialog
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
        containerId={containerIdStr}
      />
    </>
  );
};
