import React, { useMemo } from 'react';
import { AccessTokenRow } from './AccessTokenRow';
import type { AccessToken } from '@/api/modules/accessTokenApi';
import Loading from '@/components/common/Loading';

interface AccessTokenTableProps {
  tokens: AccessToken[];
  containerId: string;
  isLoading: boolean;
}

export const AccessTokenTable: React.FC<AccessTokenTableProps> = ({ tokens, containerId, isLoading }) => {
  const sortedTokens = useMemo(() => {
    if (!tokens) return [];
    const now = Date.now();
    return [...tokens].sort((a, b) => {
      const aExpired = new Date(a.expires_at).getTime() < now;
      const bExpired = new Date(b.expires_at).getTime() < now;

      // Prioridade de status: 0 (ATIVO), 1 (EXPIRADO), 2 (REVOGADO por último)
      const getStatusWeight = (token: AccessToken, isExp: boolean) => {
        if (!token.active) return 2;
        if (isExp) return 1;
        return 0;
      };

      const weightA = getStatusWeight(a, aExpired);
      const weightB = getStatusWeight(b, bExpired);

      if (weightA !== weightB) {
        return weightA - weightB;
      }

      // Se o status for o mesmo, ordena por data de criação mais recente (decrescente)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tokens]);

  if (isLoading) {
    return (
      <div className="py-8">
        <Loading message="Carregando tokens..." />
      </div>
    );
  }

  if (!sortedTokens || sortedTokens.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-md border border-dashed border-border">
        Nenhum token encontrado para este container.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="p-3 text-sm font-medium text-muted-foreground">Criado em</th>
            <th className="p-3 text-sm font-medium text-muted-foreground">Expira em</th>
            <th className="p-3 text-sm font-medium text-muted-foreground">Status</th>
            <th className="p-3 text-sm font-medium text-muted-foreground text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {sortedTokens.map((token) => (
            <AccessTokenRow key={token.id} token={token} containerId={containerId} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
