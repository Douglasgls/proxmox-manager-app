import React from 'react';
import { Badge } from '@/components/ui/badge';

interface NodeStatusBadgeProps {
  online: boolean;
  serviceRunning?: boolean;
  className?: string;
}

export const NodeStatusBadge: React.FC<NodeStatusBadgeProps> = ({
  online,
  serviceRunning = true,
  className = '',
}) => {
  if (online && serviceRunning) {
    return (
      <Badge variant="success" className={`h-6 px-2 text-xs font-medium gap-1.5 ${className}`}>
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
        <span>Online</span>
      </Badge>
    );
  }

  if (online && !serviceRunning) {
    return (
      <Badge variant="warning" className={`h-6 px-2 text-xs font-medium gap-1.5 ${className}`}>
        <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
        <span>Serviço Parado</span>
      </Badge>
    );
  }

  return (
    <Badge variant="offline" className={`h-6 px-2 text-xs font-medium gap-1.5 ${className}`}>
      <span className="size-2 rounded-full bg-red-500" aria-hidden="true" />
      <span>Offline</span>
    </Badge>
  );
};

export default NodeStatusBadge;
