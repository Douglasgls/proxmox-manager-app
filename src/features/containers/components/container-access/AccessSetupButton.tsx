import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Key, CloudOff, PowerOff } from 'lucide-react';
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
import { useToastStore } from '@/utils/clipboard';
import { extractErrorMessage } from '@/utils/error';

interface AccessSetupButtonProps {
  containerId: string | number;
  disabled?: boolean;
  isRunning?: boolean;
  tailscaleIp?: string | null;
}

export const AccessSetupButton: React.FC<AccessSetupButtonProps> = ({
  containerId,
  disabled,
  isRunning = true,
  tailscaleIp,
}) => {
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSetupCompleted, setIsSetupCompleted] = useState(false);
  
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

  // Usa tokens ou estado pós-setup para saber se o acesso remoto já foi configurado
  const { data: tokens, isSuccess } = useAccessTokens(containerIdStr);
  const hasAccessSetup = (isSuccess && Boolean(tokens && tokens.length > 0)) || isSetupCompleted;

  // Determina mensagem de bloqueio quando a cloud ou container não estiverem disponíveis
  let disabledReason: string | null = null;
  if (!isRunning && !hasAccessSetup) {
    disabledReason = 'O container precisa estar em execução para configurar o acesso remoto.';
  } else if (!isCloudLoading && !isCloudRegistered) {
    disabledReason = 'A Cloud não está vinculada. Vincule o Agent à Cloud para permitir acesso remoto.';
  } else if (!isCloudLoading && !isCloudConnected) {
    disabledReason = 'A Cloud está desconectada. Restabeleça a conexão com a Cloud para permitir acesso remoto.';
  } else if (isCloudLoading && !cloudStatus) {
    disabledReason = 'Verificando conexão com a Cloud...';
  }

  const isPermitDisabled = disabled || enableMutation.isPending || createTokenMutation.isPending || !isCloudReady || (!isRunning && !hasAccessSetup);

  const handleEnableAccess = async () => {
    if (!isCloudReady) return;
    if (!isRunning) return;
    try {
      const response = await enableMutation.mutateAsync(containerId);
      setJobId(response.job_id);
      setIsJobModalOpen(true);
    } catch (err) {
      console.error('[EnableRemoteAccess] Failed to start tailscale setup:', err);
      useToastStore.getState().showToast(extractErrorMessage(err, 'Falha ao iniciar configuração do acesso remoto'), 'error');
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
    
    // Marca setup como concluído para manter o botão em Gerenciar acessos
    setIsSetupCompleted(true);

    // Pequeno intervalo para o usuário visualizar 100% concluído antes de transitar para a escolha do token
    setTimeout(() => {
      setIsJobModalOpen(false);
      setJobId(null);
      setIsCreateOpen(true);
    }, 600);
  }, [containerId, containerIdStr, queryClient]);

  const handleConfirmCreate = async (params: CreateAccessTokenParams): Promise<boolean> => {
    try {
      const response = await createTokenMutation.mutateAsync({
        containerId: containerIdStr,
        params,
      });
      if (response.token) {
        setNewTokenData({
          token: response.token,
          expiresAt: response.expires_at,
        });
        useToastStore.getState().showToast('Token de acesso gerado e sincronizado com sucesso!', 'success');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to generate token:', err);
      useToastStore.getState().showToast(extractErrorMessage(err, 'Falha ao gerar token de acesso'), 'error');
      return false;
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
        ) : !isRunning ? (
          <PowerOff className="size-4 text-muted-foreground" />
        ) : !isCloudReady ? (
          <CloudOff className="size-4 text-muted-foreground" />
        ) : (
          <ShieldCheck className="size-4" />
        )}
        Permitir acesso
      </Button>
    );

    if (disabledReason) {
      return (
        <Tooltip content={disabledReason} side="top">
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
      {!hasAccessSetup ? (
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

      {newTokenData && !isCreateOpen && (
        <AccessTokenDialog
          isOpen={Boolean(newTokenData && !isCreateOpen)}
          onClose={() => setNewTokenData(null)}
          token={newTokenData.token}
          expiresAt={newTokenData.expiresAt}
          tailscaleIp={tailscaleIp}
        />
      )}

      <AccessManagementDialog
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
        containerId={containerIdStr}
        tailscaleIp={tailscaleIp}
      />
    </>
  );
};
