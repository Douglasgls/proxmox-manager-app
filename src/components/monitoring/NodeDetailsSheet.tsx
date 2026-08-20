import React, { useState } from 'react';
import type { CloudNode } from '@/api/modules/cloudApi';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { NodeStatusBadge } from './NodeStatusBadge';
import { NodeTypeBadge } from './NodeTypeBadge';
import { parseTailscaleIp } from './TailscaleAddress';
import { formatDateTime } from '@/utils/date';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Box,
  Laptop,
  Network,
  Copy,
  Check,
  Clock,
  Server,
  Key,
  Shield,
  Activity,
} from 'lucide-react';

interface NodeDetailsSheetProps {
  node: CloudNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const formatRelativeTime = (isoString?: string | null): string => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';

  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 0) return 'Agora';
  if (diffSeconds < 60) return `Há ${diffSeconds} segundos`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `Há ${diffMinutes} min${diffMinutes > 1 ? 's' : ''}`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Há ${diffHours} h${diffHours > 1 ? 'ras' : ''}`;

  const diffDays = Math.floor(diffHours / 24);
  return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
};

import { copyToClipboard } from '@/utils/clipboard';

const FIELD_LABELS: Record<string, string> = {
  ipv4: 'IPv4 Tailscale',
  ipv6: 'IPv6 Tailscale',
  container_id: 'Container UUID',
  machine_id: 'Machine ID',
  cloud_conn_id: 'Cloud Connection ID',
};

export const NodeDetailsSheet: React.FC<NodeDetailsSheetProps> = ({
  node,
  open,
  onOpenChange,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!node) return null;

  const isContainer = node.node_type === 'container';
  const { ipv4, ipv6 } = parseTailscaleIp(node.tailscale_ip);

  const handleCopy = async (text: string, fieldName: string) => {
    const label = FIELD_LABELS[fieldName] || 'Valor';
    const success = await copyToClipboard(text, label);
    if (success) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 mb-1">
            <NodeTypeBadge nodeType={node.node_type} />
            <NodeStatusBadge online={node.online} serviceRunning={node.service_running} />
          </div>
          <SheetTitle className="text-xl font-bold flex items-center gap-2">
            {isContainer ? <Box className="size-5 text-blue-500" /> : <Laptop className="size-5 text-purple-500" />}
            {node.container_name || node.hostname || 'Node sem nome'}
          </SheetTitle>
          <SheetDescription>
            Detalhes operacionais e técnicos de identificação do node remoto.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 my-6 text-sm">
          {/* Informações Principais */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/40 border border-border/60">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="size-3.5 text-primary" />
              Estado do Serviço
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Status</span>
                <span className="font-semibold text-foreground">{node.online ? 'Online' : 'Offline'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Serviço VPN</span>
                <span className="font-semibold text-foreground">
                  {node.service_running ? (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <Shield className="size-3" /> Em Execução
                    </span>
                  ) : (
                    <span className="text-amber-500">Parado</span>
                  )}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-border/40">
                <span className="text-muted-foreground block">Última Sincronização</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-medium text-foreground flex items-center gap-1">
                    <Clock className="size-3.5 text-muted-foreground" />
                    {formatRelativeTime(node.last_sync)}
                  </span>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {formatDateTime(node.last_sync || '')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Endereços de Rede Tailscale */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Network className="size-3.5 text-primary" />
              Endereço Tailscale VPN
            </h4>
            <div className="space-y-2">
              {ipv4 ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-card">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-medium block">IPv4</span>
                    <span className="font-mono text-xs font-semibold text-foreground">{ipv4}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => handleCopy(ipv4, 'ipv4')}
                  >
                    {copiedField === 'ipv4' ? (
                      <>
                        <Check className="size-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-medium">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 text-muted-foreground" />
                        <span>Copiar</span>
                      </>
                    )}
                  </Button>
                </div>
              ) : null}

              {ipv6 ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-card">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-medium block">IPv6</span>
                    <span className="font-mono text-xs font-semibold text-foreground">{ipv6}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => handleCopy(ipv6, 'ipv6')}
                  >
                    {copiedField === 'ipv6' ? (
                      <>
                        <Check className="size-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-medium">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 text-muted-foreground" />
                        <span>Copiar</span>
                      </>
                    )}
                  </Button>
                </div>
              ) : null}

              {!ipv4 && !ipv6 && (
                <div className="p-3 text-xs text-muted-foreground bg-muted/20 rounded-lg">
                  Nenhum IP Tailscale associado.
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Dados Específicos do Tipo */}
          {isContainer ? (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Server className="size-3.5 text-primary" />
                Dados do Container Proxmox
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground">Nome do Container:</span>
                  <span className="font-semibold text-foreground">{node.container_name || node.hostname || '-'}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground">Proxmox CT ID:</span>
                  <Badge variant="secondary" className="font-mono font-bold text-xs">
                    {node.proxmox_container_id ?? '-'}
                  </Badge>
                </div>

                {node.container_id && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Container UUID</span>
                      <span className="font-mono text-[11px] font-semibold text-foreground">{node.container_id}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopy(node.container_id!, 'container_id')}
                    >
                      {copiedField === 'container_id' ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    </Button>
                  </div>
                )}

                {node.machine_id && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Machine ID</span>
                      <span className="font-mono text-[11px] font-semibold text-foreground">{node.machine_id}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopy(node.machine_id!, 'machine_id')}
                    >
                      {copiedField === 'machine_id' ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Key className="size-3.5 text-primary" />
                Dados do Cliente VPN
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground">Hostname:</span>
                  <span className="font-semibold text-foreground">{node.hostname || '-'}</span>
                </div>

                {node.headscale_node_id && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-muted-foreground">Headscale Node ID:</span>
                    <Badge variant="secondary" className="font-mono font-bold text-xs">
                      {node.headscale_node_id}
                    </Badge>
                  </div>
                )}

                {node.cloud_connection_id && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Cloud Connection ID</span>
                      <span className="font-mono text-[11px] font-semibold text-foreground">{node.cloud_connection_id}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopy(node.cloud_connection_id!, 'cloud_conn_id')}
                    >
                      {copiedField === 'cloud_conn_id' ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    </Button>
                  </div>
                )}

                {node.machine_id && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Machine ID</span>
                      <span className="font-mono text-[11px] font-semibold text-foreground">{node.machine_id}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopy(node.machine_id!, 'machine_id')}
                    >
                      {copiedField === 'machine_id' ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NodeDetailsSheet;
