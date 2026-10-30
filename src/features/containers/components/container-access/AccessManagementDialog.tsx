import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, CloudOff, KeyRound, Laptop, ShieldCheck } from 'lucide-react';
import { useAccessTokens, useCreateAccessToken, useClientConnections } from '../../hooks';
import { AccessTokenTable } from './AccessTokenTable';
import { ClientConnectionsTable } from './ClientConnectionsTable';
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
  tailscaleIp?: string | null;
}

export const AccessManagementDialog: React.FC<AccessManagementDialogProps> = ({
  isOpen,
  onClose,
  containerId,
  tailscaleIp,
}) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'connections'>('tokens');

  const { data: tokens, isLoading: isTokensLoading, isError: isTokensError, refetch: refetchTokens } = useAccessTokens(containerId);
  const { data: connections, isLoading: isConnectionsLoading, isError: isConnectionsError, refetch: refetchConnections } = useClientConnections(containerId);
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

  const onlineConnectionsCount = connections?.filter(c => c.online).length ?? 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pr-6">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="size-4" />
              </div>
              <DialogTitle>Acesso & Conectividade Segura</DialogTitle>
            </div>

            {activeTab === 'tokens' && (
              !isCloudReady ? (
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
                  disabled={isTokensLoading}
                  className="gap-2 shrink-0 cursor-pointer"
                  size="sm"
                >
                  <Plus className="size-4" />
                  Novo Token
                </Button>
              )
            )}
          </DialogHeader>

          {/* Abas Superiores */}
          <div className="flex border-b border-border gap-6 px-1 mt-2">
            <button
              type="button"
              onClick={() => setActiveTab('tokens')}
              className={`pb-2.5 text-sm font-medium transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === 'tokens'
                  ? 'text-primary border-b-2 border-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <KeyRound className="size-4" />
              <span>Tokens de Acesso</span>
              {tokens && tokens.length > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-muted font-normal text-muted-foreground">
                  {tokens.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('connections')}
              className={`pb-2.5 text-sm font-medium transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === 'connections'
                  ? 'text-primary border-b-2 border-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Laptop className="size-4" />
              <span>Sessões Ativas</span>
              {onlineConnectionsCount > 0 ? (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
                  {onlineConnectionsCount} online
                </span>
              ) : (
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-muted font-normal text-muted-foreground">
                  0
                </span>
              )}
            </button>
          </div>

          {!isCloudReady && cloudDisabledReason && activeTab === 'tokens' && (
            <div className="mt-3 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <CloudOff className="size-4 shrink-0" />
              <span>{cloudDisabledReason}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            {activeTab === 'tokens' ? (
              isTokensError ? (
                <ErrorAlert
                  title="Erro ao carregar tokens"
                  message="Não foi possível listar os acessos remotos deste container."
                  onRetry={() => refetchTokens()}
                />
              ) : (
                <AccessTokenTable 
                  tokens={tokens || []} 
                  containerId={containerId} 
                  isLoading={isTokensLoading} 
                />
              )
            ) : (
              isConnectionsError ? (
                <ErrorAlert
                  title="Erro ao carregar conexões"
                  message="Não foi possível listar as sessões de clientes conectadas."
                  onRetry={() => refetchConnections()}
                />
              ) : (
                <ClientConnectionsTable
                  connections={connections || []}
                  isLoading={isConnectionsLoading}
                />
              )
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
          tailscaleIp={tailscaleIp}
        />
      )}
    </>
  );
};
