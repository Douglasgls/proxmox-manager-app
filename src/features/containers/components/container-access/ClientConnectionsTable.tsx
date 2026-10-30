import React from 'react';
import { Laptop, Copy, Check, Wifi, Clock, ShieldCheck } from 'lucide-react';
import type { ClientConnection } from '@/api/modules/accessTokenApi';
import Loading from '@/components/common/Loading';
import { useToastStore } from '@/utils/clipboard';

interface ClientConnectionsTableProps {
  connections: ClientConnection[];
  isLoading: boolean;
}

export const ClientConnectionsTable: React.FC<ClientConnectionsTableProps> = ({
  connections,
  isLoading,
}) => {
  const [copiedIp, setCopiedIp] = React.useState<string | null>(null);

  const handleCopyIp = async (ip: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(ip);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = ip;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedIp(ip);
      useToastStore.getState().showToast(`IP ${ip} copiado!`, 'success');
      setTimeout(() => setCopiedIp(null), 2500);
    } catch {
      useToastStore.getState().showToast('Falha ao copiar IP.', 'error');
    }
  };

  const formatLastSeen = (dateStr: string | null) => {
    if (!dateStr) return 'Recente';
    try {
      const dt = new Date(dateStr);
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(dt);
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <Loading message="Carregando conexões ativas..." />
      </div>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-muted/20 rounded-md border border-dashed border-border flex flex-col items-center justify-center gap-2">
        <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-1">
          <Wifi className="size-5" />
        </div>
        <p className="text-sm font-medium text-foreground">Nenhuma sessão ativa no momento</p>
        <p className="text-xs text-muted-foreground max-w-sm">
          Dispositivos autorizados na VPN ou clientes conectados com tokens de acesso aparecerão aqui automaticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b border-border">
            <th className="p-3 text-sm font-medium text-muted-foreground">Dispositivo</th>
            <th className="p-3 text-sm font-medium text-muted-foreground">IP Seguro (VPN)</th>
            <th className="p-3 text-sm font-medium text-muted-foreground">Status</th>
            <th className="p-3 text-sm font-medium text-muted-foreground text-right">Visto por último</th>
          </tr>
        </thead>
        <tbody>
          {connections.map((conn) => (
            <tr key={conn.id} className="border-b border-border hover:bg-muted/50 transition-colors">
              <td className="p-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Laptop className="size-4" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{conn.hostname || 'Dispositivo Cliente'}</span>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                      <ShieldCheck className="size-3 text-green-500" />
                      <span>Criptografia WireGuard</span>
                    </div>
                  </div>
                </div>
              </td>

              <td className="p-3 text-sm">
                {conn.tailscale_ip ? (
                  <div className="inline-flex items-center gap-1.5 bg-muted/80 px-2 py-1 rounded font-mono text-xs text-foreground">
                    <span>{conn.tailscale_ip}</span>
                    <button
                      onClick={() => handleCopyIp(conn.tailscale_ip!)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded cursor-pointer"
                      title="Copiar IP"
                    >
                      {copiedIp === conn.tailscale_ip ? (
                        <Check className="size-3.5 text-green-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs italic">Não atribuído</span>
                )}
              </td>

              <td className="p-3 text-sm">
                {conn.online ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                    <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                    Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                    Desconectado
                  </span>
                )}
              </td>

              <td className="p-3 text-sm text-right text-muted-foreground text-xs">
                <div className="flex items-center justify-end gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground/70" />
                  <span>{formatLastSeen(conn.last_seen || conn.created_at)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
