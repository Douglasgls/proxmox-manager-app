import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { useRevokeAccessToken } from '../../hooks';
import type { AccessToken } from '@/api/modules/accessTokenApi';

interface AccessTokenRowProps {
  token: AccessToken;
  containerId: string;
}

export const AccessTokenRow: React.FC<AccessTokenRowProps> = ({ token, containerId }) => {
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const revokeMutation = useRevokeAccessToken();

  const handleRevoke = async () => {
    if (!confirmRevoke) {
      setConfirmRevoke(true);
      return;
    }

    try {
      await revokeMutation.mutateAsync({ tokenId: token.id, containerId });
    } catch (error) {
      console.error('Failed to revoke token:', error);
      setConfirmRevoke(false);
    }
  };

  const isExpired = new Date(token.expires_at) < new Date();
  
  let status = 'ACTIVE';
  if (!token.active && !isExpired) status = 'REVOKED';
  else if (isExpired) status = 'EXPIRED';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/10 text-green-500';
      case 'REVOKED': return 'bg-red-500/10 text-red-500';
      case 'EXPIRED': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Ativo';
      case 'REVOKED': return 'Revogado';
      case 'EXPIRED': return 'Expirado';
      default: return status || 'Desconhecido';
    }
  };

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="p-3 text-sm">
        {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(token.created_at))}
      </td>
      <td className="p-3 text-sm">
        {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(token.expires_at))}
      </td>
      <td className="p-3 text-sm">
        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(status)}`}>
          {getStatusLabel(status)}
        </span>
      </td>
      <td className="p-3 text-sm text-right">
        {status === 'ACTIVE' && (
          <Button
            variant={confirmRevoke ? "destructive" : "ghost"}
            size="sm"
            onClick={handleRevoke}
            disabled={revokeMutation.isPending}
            className="h-8"
          >
            {revokeMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : confirmRevoke ? (
              "Confirmar"
            ) : (
              <>
                <Trash2 className="size-4 mr-2" />
                Revogar
              </>
            )}
          </Button>
        )}
      </td>
    </tr>
  );
};
