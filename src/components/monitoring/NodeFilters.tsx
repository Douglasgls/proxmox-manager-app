import React, { useMemo } from 'react';
import type { CloudNode } from '@/api/modules/cloudApi';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X, Box, Laptop, Wifi, WifiOff, Layers } from 'lucide-react';
import { SyncNodesButton } from './SyncNodesButton';
import { filterDuplicateClientNodes } from '@/utils/cloudNodes';

export type FilterTab = 'all' | 'container' | 'client' | 'online' | 'offline';

interface NodeFiltersProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  nodes: CloudNode[];
  onSync?: () => void | Promise<void>;
  isSyncing?: boolean;
  cooldownRemaining?: number;
  canSync?: boolean;
  lastSyncTime?: Date | null;
}

export const NodeFilters: React.FC<NodeFiltersProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  nodes,
  onSync,
  isSyncing = false,
  cooldownRemaining = 0,
  canSync = true,
  lastSyncTime,
}) => {
  const sanitizedNodes = useMemo(() => filterDuplicateClientNodes(nodes), [nodes]);

  const counts = {
    all: sanitizedNodes.length,
    container: sanitizedNodes.filter((n) => n.node_type === 'container').length,
    client: sanitizedNodes.filter((n) => n.node_type === 'client').length,
    online: sanitizedNodes.filter((n) => n.online).length,
    offline: sanitizedNodes.filter((n) => !n.online).length,
  };

  const tabs: { key: FilterTab; label: string; count: number; icon: React.ElementType }[] = [
    { key: 'all', label: 'Todos', count: counts.all, icon: Layers },
    { key: 'container', label: 'Containers', count: counts.container, icon: Box },
    { key: 'client', label: 'Clientes', count: counts.client, icon: Laptop },
    { key: 'online', label: 'Online', count: counts.online, icon: Wifi },
    { key: 'offline', label: 'Offline', count: counts.offline, icon: WifiOff },
  ];

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-2 rounded-xl bg-card border border-border/80 shadow-xs">
      {/* Abas de Filtro */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap outline-none cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
              <Badge
                variant={isActive ? 'secondary' : 'outline'}
                className={`h-4 px-1.5 text-[10px] rounded-full font-bold ${
                  isActive ? 'bg-primary-foreground/20 text-primary-foreground border-transparent' : ''
                }`}
              >
                {tab.count}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Controles da Direita: Busca e Sincronização */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-[200px] md:w-64">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por hostname, IP, tag ou ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8 pr-8 text-xs bg-background/50 border-border/70 focus:bg-background"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-5 p-0 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => onSearchChange('')}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>

        {onSync && (
          <SyncNodesButton
            onSync={onSync}
            isSyncing={isSyncing}
            cooldownRemaining={cooldownRemaining}
            canSync={canSync}
            lastSyncTime={lastSyncTime}
            size="sm"
          />
        )}
      </div>
    </div>
  );
};

export default NodeFilters;

