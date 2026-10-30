import React, { useMemo, useState } from 'react';
import { AccessTokenRow } from './AccessTokenRow';
import type { AccessToken } from '@/api/modules/accessTokenApi';
import Loading from '@/components/common/Loading';
import { KeyRound } from 'lucide-react';

interface AccessTokenTableProps {
  tokens: AccessToken[];
  containerId: string;
  isLoading: boolean;
}

export const AccessTokenTable: React.FC<AccessTokenTableProps> = ({ tokens, containerId, isLoading }) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const now = Date.now();

  const counts = useMemo(() => {
    if (!tokens) return { all: 0, active: 0, inactive: 0 };
    let active = 0;
    let inactive = 0;
    for (const t of tokens) {
      const isExp = new Date(t.expires_at).getTime() < now;
      if (t.active && !isExp) {
        active++;
      } else {
        inactive++;
      }
    }
    return { all: tokens.length, active, inactive };
  }, [tokens, now]);

  const filteredTokens = useMemo(() => {
    if (!tokens) return [];
    
    return tokens.filter((token) => {
      const isExp = new Date(token.expires_at).getTime() < now;
      const isActive = token.active && !isExp;
      if (filter === 'ACTIVE') return isActive;
      if (filter === 'INACTIVE') return !isActive;
      return true;
    }).sort((a, b) => {
      const aExpired = new Date(a.expires_at).getTime() < now;
      const bExpired = new Date(b.expires_at).getTime() < now;

      // Prioridade: Ativo (0) -> Expirado (1) -> Revogado (2)
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

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tokens, filter, now]);

  if (isLoading) {
    return (
      <div className="py-8">
        <Loading message="Carregando tokens..." />
      </div>
    );
  }

  if (!tokens || tokens.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-muted/20 rounded-md border border-dashed border-border flex flex-col items-center justify-center gap-2">
        <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-1">
          <KeyRound className="size-5" />
        </div>
        <p className="text-sm font-medium text-foreground">Nenhum token configurado</p>
        <p className="text-xs text-muted-foreground max-w-sm">
          Crie um novo token de acesso temporário para permitir conexões seguras e criptografadas a este container.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filtros em abas estilo pílula */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-lg w-fit text-xs">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
            filter === 'ALL'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Todos ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => setFilter('ACTIVE')}
          className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            filter === 'ACTIVE'
              ? 'bg-background text-green-600 dark:text-green-400 shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="size-1.5 rounded-full bg-green-500" />
          Ativos ({counts.active})
        </button>
        <button
          type="button"
          onClick={() => setFilter('INACTIVE')}
          className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
            filter === 'INACTIVE'
              ? 'bg-background text-muted-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Inativos / Expirados ({counts.inactive})
        </button>
      </div>

      {filteredTokens.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground bg-muted/10 rounded-md border border-border">
          Nenhum token encontrado neste filtro.
        </div>
      ) : (
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
              {filteredTokens.map((token) => (
                <AccessTokenRow key={token.id} token={token} containerId={containerId} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
