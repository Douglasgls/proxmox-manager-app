import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nenhum registro encontrado',
  description = 'Não há dados disponíveis para exibir no momento.',
  icon,
  className,
  action,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border bg-card text-card-foreground max-w-md mx-auto my-6 gap-4 shadow-sm',
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 text-muted-foreground">
        {icon || <Inbox className="size-8" />}
      </div>
      <div>
        <h4 className="text-md font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
