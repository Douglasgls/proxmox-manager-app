import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, CloudOff } from 'lucide-react';
import { useAccessTokens, useCreateAccessToken } from '../../hooks';
import { AccessTokenTable } from './AccessTokenTable';
import { AccessTokenDialog } from './AccessTokenDialog';
import { CreateTokenDialog } from './CreateTokenDialog';
import type { CreateAccessTokenParams } from '@/api/modules/accessTokenApi';
import ErrorAlert from '@/components/common/Error';
import { useCloudConnection } from '@/hooks/useCloudConnection';
import { Tooltip } from '@/components/ui/tooltip';
import { useToastStore } from '@/utils/clipboard';
import { extractErrorMessage } from '@/utils/error';

interface AccessManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  containerId: string;
}

export const AccessManagementDialog: React.FC<AccessManagementDialogProps> = ({
  isOpen,
  onClose,
  containerId,
}) => {
  const { data: tokens, isLoading, isError, refetch } = useAccessTokens(containerId);
  const createMutation = useCreateAccessToken();

  const { status: cloudStatus, isLoading: isCloudLoading } = useCloudConnection();
  const isCloudRegistered = Boolean(cloudStatus?.registered);
  const isCloudConnected = Boolean(cloudStatus?.connected);
  const isCloudReady = isCloudRegistered && isCloudConnected;

  let cloudDisabledReason: string | null = null;
  if (!isCloudLoading && !isCloudRegistered) {
    cloudDisabledReason = 'A Cloud não está vinculada. Vincule o Agent à Cloud para gerar novos tokens.';
  } else if (!isCloudLoading && !isCloudConnected) {
    cloudDisabledReason = 'A Cloud está desconectada. Restabeleça a conexão para gerar novos tokens.';
  } else if (isCloudLoading && !cloudStatus) {
    cloudDisabledReason = 'Verificando conexão com a Cloud...';
  }

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTokenData, setNewTokenData] = useState<{ token: string; expiresAt: string } | null>(null);

  const handleConfirmCreate = async (params: CreateAccessTokenParams): Promise<boolean> => {
    try {
      const response = await createMutation.mutateAsync({ containerId, params });
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pr-6">
            <DialogTitle>Gerenciar Acessos</DialogTitle>
            {!isCloudReady ? (
              <Tooltip content={cloudDisabledReason || 'Cloud indisponível'} side="left">
                <span className="inline-block cursor-not-allowed">
                  <Button
                    disabled
                    className="gap-2 shrink-0 cursor-not-allowed opacity-60"
                    size="sm"
                  >
                    <CloudOff className="size-4" />
                    Novo Token
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Button
                onClick={() => setIsCreateOpen(true)}
                disabled={isLoading}
                className="gap-2 shrink-0 cursor-pointer"
                size="sm"
              >
                <Plus className="size-4" />
                Novo Token
              </Button>
            )}
          </DialogHeader>

          {!isCloudReady && cloudDisabledReason && (
            <div className="mx-6 mb-3 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <CloudOff className="size-4 shrink-0" />
              <span>{cloudDisabledReason}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {isError ? (
              <ErrorAlert
                title="Erro ao carregar tokens"
                message="Não foi possível listar os acessos remotos deste container."
                onRetry={() => refetch()}
              />
            ) : (
              <AccessTokenTable 
                tokens={tokens || []} 
                containerId={containerId} 
                isLoading={isLoading} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateTokenDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onConfirm={handleConfirmCreate}
        isLoading={createMutation.isPending}
      />

      {newTokenData && !isCreateOpen && (
        <AccessTokenDialog
          isOpen={Boolean(newTokenData && !isCreateOpen)}
          onClose={() => setNewTokenData(null)}
          token={newTokenData.token}
          expiresAt={newTokenData.expiresAt}
        />
      )}
    </>
  );
};
