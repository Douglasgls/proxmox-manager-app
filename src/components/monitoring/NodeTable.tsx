import React, { useState, useMemo } from 'react';
import type { CloudNode } from '@/api/modules/cloudApi';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { NodeFilters, type FilterTab } from './NodeFilters';
import { NodeTableRow } from './NodeTableRow';
import { NodeDetailsSheet } from './NodeDetailsSheet';
import { Network, AlertCircle, RefreshCw, Layers } from 'lucide-react';

interface NodeTableProps {
  nodes: CloudNode[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRefresh: () => void;
}

export const NodeTable: React.FC<NodeTableProps> = ({
  nodes,
  isLoading,
  isError,
  error,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<CloudNode | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleSelectNode = (node: CloudNode) => {
    setSelectedNode(node);
    setIsSheetOpen(true);
  };

  // Filtragem otimizada por computed / useMemo
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      // 1. Filtro por Aba
      if (activeTab === 'container' && node.node_type !== 'container') return false;
      if (activeTab === 'client' && node.node_type !== 'client') return false;
      if (activeTab === 'online' && !node.online) return false;
      if (activeTab === 'offline' && node.online) return false;

      // 2. Filtro por Busca Textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const hostname = (node.hostname || '').toLowerCase();
        const containerName = (node.container_name || '').toLowerCase();
        const tailscaleIp = (node.tailscale_ip || '').toLowerCase();
        const proxmoxId = String(node.proxmox_container_id || '');
        const machineId = (node.machine_id || '').toLowerCase();
        const cloudConnId = (node.cloud_connection_id || '').toLowerCase();
        const headscaleId = (node.headscale_node_id || '').toLowerCase();

        const matches =
          hostname.includes(query) ||
          containerName.includes(query) ||
          tailscaleIp.includes(query) ||
          proxmoxId.includes(query) ||
          machineId.includes(query) ||
          cloudConnId.includes(query) ||
          headscaleId.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [nodes, activeTab, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca */}
      <NodeFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        nodes={nodes}
      />

      {/* Estado 1: Erro no carregamento da API */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="size-5" />
          <AlertTitle className="font-bold">Não foi possível carregar os dados de monitoring.</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
            <span>
              {error instanceof Error ? error.message : 'Ocorreu uma falha de comunicação com o Agent.'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="h-8 text-xs gap-1.5 self-start sm:self-auto bg-background hover:bg-muted"
            >
              <RefreshCw className="size-3.5" />
              <span>Tentar novamente</span>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabela Principal */}
      <div className="border border-border/80 bg-card shadow-xs rounded-xl overflow-hidden">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-32 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Node</TableHead>
                <TableHead className="w-28 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">IP Tailscale</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Container / Conexão</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Última Sincronização</TableHead>
                <TableHead className="w-16 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Estado 2: Loading (Skeletons) */}
              {isLoading &&
                Array.from({ length: 4 }).map((_, idx) => (
                  <TableRow key={idx} className="h-14">
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-36 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-6 rounded ml-auto" /></TableCell>
                  </TableRow>
                ))}

              {/* Estado 3: Lista Renderizada */}
              {!isLoading && !isError && filteredNodes.length > 0 && (
                filteredNodes.map((node, index) => (
                  <NodeTableRow
                    key={node.machine_id || node.cloud_connection_id || node.headscale_node_id || index}
                    node={node}
                    onSelectNode={handleSelectNode}
                  />
                ))
              )}

              {/* Estado 4: Lista Vazia / Nenhum Node Encontrado */}
              {!isLoading && !isError && filteredNodes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center py-8">
                    <div className="flex flex-col items-center justify-center space-y-3 text-muted-foreground">
                      <div className="p-3 rounded-full bg-muted/50 border border-border">
                        {searchQuery || activeTab !== 'all' ? (
                          <Layers className="size-8 opacity-60" />
                        ) : (
                          <Network className="size-8 opacity-60" />
                        )}
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <h4 className="text-base font-bold text-foreground">
                          {searchQuery || activeTab !== 'all'
                            ? 'Nenhum resultado encontrado'
                            : 'Nenhum node encontrado'}
                        </h4>
                        <p className="text-xs">
                          {searchQuery || activeTab !== 'all'
                            ? 'Não encontramos nenhum container ou cliente VPN com os filtros selecionados.'
                            : 'Ainda não existem containers publicados ou clientes VPN conectados a este ambiente.'}
                        </p>
                      </div>
                      {(searchQuery || activeTab !== 'all') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveTab('all');
                            setSearchQuery('');
                          }}
                          className="h-8 text-xs mt-2"
                        >
                          Limpar Filtros
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Sheet Lateral de Detalhes */}
      <NodeDetailsSheet
        node={selectedNode}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </div>
  );
};

export default NodeTable;
