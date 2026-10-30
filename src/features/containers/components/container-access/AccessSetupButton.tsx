import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Key, CloudOff } from 'lucide-react';
import { useEnableRemoteAccess } from '../../hooks';
import { JobProgressModal } from '../JobProgressModal';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateAccessToken, useAccessTokens } from '../../hooks';
import { AccessTokenDialog } from './AccessTokenDialog';
import { AccessManagementDialog } from './AccessManagementDialog';
import { CreateTokenDialog } from './CreateTokenDialog';
import type { CreateAccessTokenParams } from '@/api/modules/accessTokenApi';
import { useCloudConnection } from '@/hooks/useCloudConnection';
import { Tooltip } from '@/components/ui/tooltip';

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
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [newTokenData, setNewTokenData] = useState<{ token: string; expiresAt: string } | null>(null);
  
  const queryClient = useQueryClient();
  const enableMutation = useEnableRemoteAccess();
  const createTokenMutation = useCreateAccessToken();
  
  const containerIdStr = String(containerId);
  
  // Status da conexão com a Cloud Control Plane
  const { status: cloudStatus, isLoading: isCloudLoading } = useCloudConnection();
  const isCloudRegistered = Boolean(cloudStatus?.registered);
  const isCloudConnected = Boolean(cloudStatus?.connected);
  const isCloudReady = isCloudRegistered && isCloudConnected;

  // Use tokens to know if remote access is already set up. 
  const { data: tokens, isSuccess } = useAccessTokens(containerIdStr);
  const hasTokens = isSuccess && tokens && tokens.length > 0;

  // Determina mensagem de bloqueio quando a cloud não estiver disponível
  let cloudDisabledReason: string | null = null;
  if (!isCloudLoading && !isCloudRegistered) {
    cloudDisabledReason = 'A Cloud não está vinculada. Vincule o Agent à Cloud para permitir acesso remoto.';
  } else if (!isCloudLoading && !isCloudConnected) {
    cloudDisabledReason = 'A Cloud está desconectada. Restabeleça a conexão com a Cloud para permitir acesso remoto.';
  } else if (isCloudLoading && !cloudStatus) {
    cloudDisabledReason = 'Verificando conexão com a Cloud...';
  }

  const isPermitDisabled = disabled || enableMutation.isPending || createTokenMutation.isPending || !isCloudReady;

  const handleEnableAccess = async () => {
    if (!isCloudReady) return;
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

  const handleJobComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['containers', containerId] });
    queryClient.invalidateQueries({ queryKey: ['containers'] });
    queryClient.invalidateQueries({ queryKey: ['access-tokens', containerIdStr] });
    
    // Pequeno intervalo para o usuário visualizar 100% concluído antes de transitar para a escolha do token
    setTimeout(() => {
      setIsJobModalOpen(false);
      setJobId(null);
      setIsCreateOpen(true);
    }, 600);
  }, [containerId, containerIdStr, queryClient]);

  const handleConfirmCreate = async (params: CreateAccessTokenParams) => {
    try {
      const response = await createTokenMutation.mutateAsync({
        containerId: containerIdStr,
        params,
      });
      if (response.token) {
        setIsCreateOpen(false);
        setNewTokenData({
          token: response.token,
          expiresAt: response.expires_at,
        });
      }
    } catch (err) {
      console.error('Failed to generate token:', err);
    }
  };

  const renderPermitButton = () => {
    const button = (
      <Button
        variant="outline"
        size="sm"
        disabled={isPermitDisabled}
        onClick={handleEnableAccess}
        className="gap-2"
      >
        {enableMutation.isPending || createTokenMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : !isCloudReady ? (
          <CloudOff className="size-4 text-muted-foreground" />
        ) : (
          <ShieldCheck className="size-4" />
        )}
        Permitir acesso
      </Button>
    );

    if (cloudDisabledReason) {
      return (
        <Tooltip content={cloudDisabledReason} side="top">
          <span className="inline-block cursor-not-allowed">
            {button}
          </span>
        </Tooltip>
      );
    }

    return button;
  };

  return (
    <>
      {!hasTokens ? (
        renderPermitButton()
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

      <CreateTokenDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onConfirm={handleConfirmCreate}
        isLoading={createTokenMutation.isPending}
      />

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
