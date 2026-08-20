import React from 'react';
import { Badge } from '@/components/ui/badge';

interface NodeTypeBadgeProps {
  nodeType: 'container' | 'client' | string;
  className?: string;
}

export const NodeTypeBadge: React.FC<NodeTypeBadgeProps> = ({ nodeType, className = '' }) => {
  const isContainer = nodeType === 'container';

  if (isContainer) {
    return (
      <Badge
        variant="outline"
        className={`h-6 px-2.5 text-xs font-medium justify-center text-center bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 ${className}`}
      >
        <span>Container</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`h-6 px-2.5 text-xs font-medium justify-center text-center bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30 ${className}`}
    >
      <span>Cliente</span>
    </Badge>
  );
};

export default NodeTypeBadge;
