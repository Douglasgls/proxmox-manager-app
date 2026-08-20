import React from 'react';
import type { CloudDetailsResponse } from '@/api/modules/cloudApi';
import { Card, CardContent } from '@/components/ui/card';
import { Network, Wifi, Box, Laptop, WifiOff } from 'lucide-react';

interface MonitoringSummaryCardsProps {
  data?: CloudDetailsResponse;
  isLoading: boolean;
}

export const MonitoringSummaryCards: React.FC<MonitoringSummaryCardsProps> = ({
  data,
  isLoading,
}) => {
  const totalNodes = data?.total_nodes ?? 0;
  const onlineNodes = data?.online_nodes ?? 0;
  
  const nodes = data?.nodes || [];
  const containersCount = nodes.filter((n) => n.node_type === 'container').length;
  const clientsCount = nodes.filter((n) => n.node_type === 'client').length;
  const offlineNodes = Math.max(0, totalNodes - onlineNodes);

  const cards = [
    {
      title: 'Total de Nodes',
      value: totalNodes,
      description: 'Nodes registrados na rede',
      icon: Network,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Online',
      value: onlineNodes,
      description: 'Nodes ativos e responsivos',
      icon: Wifi,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Containers',
      value: containersCount,
      description: 'Containers Proxmox publicados',
      icon: Box,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Clientes',
      value: clientsCount,
      description: 'Clientes VPN externos',
      icon: Laptop,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Offline',
      value: offlineNodes,
      description: 'Nodes desconectados',
      icon: WifiOff,
      color: offlineNodes > 0 ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className="border border-border/80 bg-card shadow-xs hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  {card.title}
                </span>
                {isLoading ? (
                  <div className="h-8 w-12 bg-muted/60 animate-pulse rounded my-1" />
                ) : (
                  <span className="text-2xl font-extrabold text-foreground tracking-tight block">
                    {card.value}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground block truncate max-w-[140px]" title={card.description}>
                  {card.description}
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${card.color} self-start mt-0.5`}>
                <Icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MonitoringSummaryCards;
