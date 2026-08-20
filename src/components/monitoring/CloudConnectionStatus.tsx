import React, { useState } from 'react';
import type { CloudDetailsResponse } from '@/api/modules/cloudApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { formatDateTime } from '@/utils/date';
import {
  Cloud,
  CloudOff,
  CloudAlert,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  KeyRound,
  Activity,
} from 'lucide-react';

interface CloudConnectionStatusProps {
  data?: CloudDetailsResponse;
  isLoading: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  onReconnect: () => Promise<any>;
  isReconnecting: boolean;
}

import { copyToClipboard } from '@/utils/clipboard';

const STATUS_FIELD_LABELS: Record<string, string> = {
  cloud_url: 'URL da Cloud',
  env_id: 'Environment ID',
};

export const CloudConnectionStatus: React.FC<CloudConnectionStatusProps> = ({
  data,
  isLoading,
  isFetching,
  onRefresh,
  onReconnect,
  isReconnecting,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const registered = data?.registered ?? false;
  const connected = data?.connected ?? false;
  const jwtValid = data?.jwt_valid ?? false;

  const handleCopy = async (text: string, fieldName: string) => {
    const label = STATUS_FIELD_LABELS[fieldName] || 'Valor';
    const success = await copyToClipboard(text, label);
    if (success) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const showJwtInconsistency = connected && !jwtValid;

  return (
    <Card className="border border-border/80 bg-card shadow-sm rounded-xl overflow-hidden transition-all">
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${connected ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
              {connected ? <Cloud className="size-6" /> : <CloudOff className="size-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-foreground">Cloud Control</CardTitle>
                <Badge variant={connected ? 'success' : 'offline'} className="h-5 px-2 text-xs font-semibold gap-1">
                  <span className={`size-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  {connected ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Estado da conexão em tempo real e chave JWT de autenticação do Agent
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading || isFetching}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
              <span>Sincronizar</span>
            </Button>

            {registered && (
              <Button
                variant={connected ? 'secondary' : 'default'}
                size="sm"
                onClick={onReconnect}
                disabled={isReconnecting}
                className="h-8 text-xs gap-1.5"
              >
                {isReconnecting ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Reconectando...</span>
                  </>
                ) : (
                  <>
                    <Activity className="size-3.5" />
                    <span>Reconectar</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Alerta explícito de inconsistência JWT */}
        {showJwtInconsistency && (
          <Alert variant="warning" className="border-amber-500/40 bg-amber-500/10">
            <CloudAlert className="size-5" />
            <AlertTitle className="font-bold flex items-center gap-2 text-amber-900 dark:text-amber-300">
              Conexão Ativa com Autenticação Expirada
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-400">
              O Agent possui conexão WebSocket estabelecida com a Cloud Control (`connected: true`), mas o token JWT expirou (`jwt_valid: false`). Recomenda-se renovar o Environment Token nas configurações do Agent.
            </AlertDescription>
          </Alert>
        )}

        {/* Informações detalhadas do ambiente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Cloud URL */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
              <ExternalLink className="size-3 text-primary" />
              URL da Cloud
            </span>
            <div className="flex items-center justify-between gap-1 pt-0.5">
              <span className="font-mono font-medium text-foreground truncate max-w-[160px]" title={data?.cloud_url || '-'}>
                {data?.cloud_url || '-'}
              </span>
              {data?.cloud_url && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-5 p-0 h-5 w-5"
                  onClick={() => handleCopy(data.cloud_url!, 'cloud_url')}
                >
                  {copiedField === 'cloud_url' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                </Button>
              )}
            </div>
          </div>

          {/* Environment ID */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
              <KeyRound className="size-3 text-primary" />
              Environment ID
            </span>
            <div className="flex items-center justify-between gap-1 pt-0.5">
              <span className="font-mono font-medium text-foreground truncate max-w-[160px]" title={data?.cloud_environment_id || '-'}>
                {data?.cloud_environment_id || 'Não registrado'}
              </span>
              {data?.cloud_environment_id && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-5 p-0 h-5 w-5"
                  onClick={() => handleCopy(data.cloud_environment_id!, 'env_id')}
                >
                  {copiedField === 'env_id' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                </Button>
              )}
            </div>
          </div>

          {/* Autenticação JWT */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
              {jwtValid ? <ShieldCheck className="size-3 text-emerald-500" /> : <ShieldAlert className="size-3 text-amber-500" />}
              Autenticação JWT
            </span>
            <div className="flex items-center justify-between pt-0.5">
              <span className={`font-semibold flex items-center gap-1 ${jwtValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {jwtValid ? 'Válido' : 'Expirado'}
              </span>
              {data?.jwt_expires_at && (
                <span className="text-[10px] text-muted-foreground font-mono" title={`Expira em: ${formatDateTime(data.jwt_expires_at)}`}>
                  {formatDateTime(data.jwt_expires_at).split(' ')[0]}
                </span>
              )}
            </div>
          </div>

          {/* Registrado em */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
              <Calendar className="size-3 text-primary" />
              Registrado em
            </span>
            <div className="pt-0.5 font-medium text-foreground font-mono">
              {data?.registered_at ? formatDateTime(data.registered_at) : '-'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CloudConnectionStatus;
