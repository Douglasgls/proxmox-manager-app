import React from 'react';
import { AccessTokenRow } from './AccessTokenRow';
import type { AccessToken } from '@/api/modules/accessTokenApi';
import Loading from '@/components/common/Loading';

interface AccessTokenTableProps {
  tokens: AccessToken[];
  containerId: string;
  isLoading: boolean;
}

export const AccessTokenTable: React.FC<AccessTokenTableProps> = ({ tokens, containerId, isLoading }) => {
  if (isLoading) {
    return (
      <div className="py-8">
        <Loading message="Carregando tokens..." />
      </div>
    );
  }

  if (!tokens || tokens.length === 0) {
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
          {tokens.map((token) => (
            <AccessTokenRow key={token.id} token={token} containerId={containerId} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
