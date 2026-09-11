import React from 'react';
import type { CloudNode } from '@/api/modules/cloudApi';
import { TableRow, TableCell } from '@/components/ui/table';
import { NodeStatusBadge } from './NodeStatusBadge';
import { NodeTypeBadge } from './NodeTypeBadge';
import { TailscaleAddress } from './TailscaleAddress';
import { formatRelativeTime } from './NodeDetailsSheet';
import { formatDateTime } from '@/utils/date';
import { Tooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Clock, Box, Laptop } from 'lucide-react';

interface NodeTableRowProps {
  node: CloudNode;
  onSelectNode: (node: CloudNode) => void;
}

export const NodeTableRow: React.FC<NodeTableRowProps> = ({ node, onSelectNode }) => {
  const isContainer = node.node_type === 'container';

  const tooltipSyncContent = (
    <div className="text-xs p-1">
      <span className="text-muted-foreground block">Data exata da última sincronização:</span>
      <span className="font-mono font-medium text-foreground">{formatDateTime(node.last_sync || '')}</span>
    </div>
  );

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/40 transition-colors group"
      onClick={() => onSelectNode(node)}
    >
      {/* Status */}
      <TableCell className="w-32 py-3">
        <NodeStatusBadge online={node.online} serviceRunning={node.service_running} />
      </TableCell>

      {/* Node / Hostname */}
      <TableCell className="py-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg shrink-0 ${isContainer ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
            {isContainer ? <Box className="size-4" /> : <Laptop className="size-4" />}
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                {node.container_name || node.name || node.hostname || 'Sem identificação'}
              </span>
              {node.ephemeral && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  Efêmero
                </Badge>
              )}
              {node.expired && (
                <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5">
                  Expirado
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {node.hostname && (node.container_name || node.name) && node.hostname !== (node.container_name || node.name) && (
                <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">
                  {node.hostname}
                </span>
              )}
              {node.tags && node.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  {node.tags.slice(0, 2).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[9px] px-1 py-0 h-3.5 font-mono text-muted-foreground">
                      {tag}
                    </Badge>
                  ))}
                  {node.tags.length > 2 && (
                    <span className="text-[9px] text-muted-foreground font-mono">
                      +{node.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </TableCell>

      {/* Tipo */}
      <TableCell className="w-28 py-3">
        <NodeTypeBadge nodeType={node.node_type} />
      </TableCell>

      {/* IP Tailscale */}
      <TableCell className="py-3">
        <TailscaleAddress tailscaleIp={node.tailscale_ip} />
      </TableCell>

      {/* Container / Conexão */}
      <TableCell className="py-3 text-xs">
        {isContainer ? (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium">Proxmox CT:</span>
            {node.proxmox_container_id ? (
              <Badge variant="secondary" className="font-mono font-bold text-xs">
                {node.proxmox_container_id}
              </Badge>
            ) : (
              <span className="text-muted-foreground font-mono text-[11px]">-</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium">Headscale ID:</span>
            {node.headscale_node_id ? (
              <Badge variant="outline" className="font-mono font-semibold text-xs">
                #{node.headscale_node_id}
              </Badge>
            ) : (
              <span className="text-muted-foreground font-mono text-[11px]">-</span>
            )}
          </div>
        )}
      </TableCell>

      {/* Última Sincronização */}
      <TableCell className="py-3 text-xs">
        <Tooltip content={tooltipSyncContent} side="top">
          <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors cursor-help">
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="font-medium text-xs">{formatRelativeTime(node.last_sync)}</span>
          </div>
        </Tooltip>
      </TableCell>

      {/* Ações */}
      <TableCell className="w-16 py-3 text-right">
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7 p-0 opacity-60 group-hover:opacity-100 group-hover:bg-primary/10 group-hover:text-primary transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onSelectNode(node);
          }}
          aria-label="Ver detalhes do node"
        >
          <ChevronRight className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default NodeTableRow;
