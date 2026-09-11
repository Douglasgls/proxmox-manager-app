import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from './NodeDetailsSheet';

interface SyncNodesButtonProps {
  onSync: () => void | Promise<void>;
  isSyncing: boolean;
  cooldownRemaining: number;
  canSync: boolean;
  lastSyncTime?: Date | null;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';
  className?: string;
  showLastSync?: boolean;
}

export const SyncNodesButton: React.FC<SyncNodesButtonProps> = ({
  onSync,
  isSyncing,
  cooldownRemaining,
  canSync: _canSync,
  lastSyncTime,
  variant = 'outline',
  size = 'sm',
  className,
  showLastSync = false,
}) => {
  const isInCooldown = cooldownRemaining > 0;
  const isDisabled = isSyncing || isInCooldown;

  const tooltipText = isSyncing
    ? 'Sincronização em andamento com o Headscale...'
    : isInCooldown
    ? `Aguarde ${cooldownRemaining}s para sincronizar novamente.`
    : 'Sincronizar nós Headscale instantaneamente com a Cloud (node.sync)';

  const lastSyncIso = lastSyncTime ? lastSyncTime.toISOString() : null;

  return (
    <div className="flex items-center gap-2">
      {showLastSync && lastSyncTime && (
        <span className="text-[11px] text-muted-foreground flex items-center gap-1 hidden sm:inline-flex">
          <Clock className="size-3 text-muted-foreground/80" />
          <span>Sincronizado {formatRelativeTime(lastSyncIso)}</span>
        </span>
      )}

      <Tooltip content={tooltipText} side="bottom">
        <Button
          variant={variant}
          size={size}
          onClick={onSync}
          disabled={isDisabled}
          className={cn(
            'relative font-medium transition-all gap-1.5 cursor-pointer',
            isInCooldown && 'opacity-70 cursor-not-allowed border-dashed',
            isSyncing && 'border-primary/50 text-primary',
            className
          )}
          aria-label="Sincronizar nós Headscale"
        >
          <RefreshCw
            className={cn(
              'size-3.5 transition-transform',
              isSyncing && 'animate-spin text-primary',
              isInCooldown && 'text-muted-foreground'
            )}
          />

          <span>
            {isSyncing
              ? 'Sincronizando...'
              : isInCooldown
              ? `Sincronizar (${cooldownRemaining}s)`
              : 'Sincronizar Nós'}
          </span>

          {isInCooldown && (
            <span
              className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-muted-foreground/20 px-1 text-[9px] font-mono font-bold text-muted-foreground"
            >
              {cooldownRemaining}s
            </span>
          )}
        </Button>
      </Tooltip>
    </div>
  );
};

export default SyncNodesButton;
