import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useAccessTokens, useCreateAccessToken } from '../../hooks';
import { AccessTokenTable } from './AccessTokenTable';
import { AccessTokenDialog } from './AccessTokenDialog';
import ErrorComponent from '@/components/common/Error';

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

  const [newTokenData, setNewTokenData] = useState<{ token: string; expiresAt: string } | null>(null);

  const handleGenerateToken = async () => {
    try {
      const response = await createMutation.mutateAsync(containerId);
      if (response.token) {
        setNewTokenData({
          token: response.token,
          expiresAt: response.expires_at,
        });
      }
    } catch (err) {
      console.error('Failed to generate token:', err);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pr-6">
            <DialogTitle>Gerenciar Acessos</DialogTitle>
            <Button
              onClick={handleGenerateToken}
              disabled={createMutation.isPending || isLoading}
              className="gap-2 shrink-0"
              size="sm"
            >
              {createMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Novo Token
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isError ? (
              <ErrorComponent
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

      {newTokenData && (
        <AccessTokenDialog
          isOpen={!!newTokenData}
          onClose={() => setNewTokenData(null)}
          token={newTokenData.token}
          expiresAt={newTokenData.expiresAt}
        />
      )}
    </>
  );
};
