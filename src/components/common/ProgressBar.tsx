import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0 a 100 por padrão, ou relativo a max
  max?: number;
  showPercentage?: boolean;
  className?: string;
  height?: 'xs' | 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showPercentage = false,
  className,
  height = 'sm',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Determina a cor com base no preenchimento
  let progressColor = 'bg-green-500 dark:bg-green-600';
  if (percentage >= 90) {
    progressColor = 'bg-destructive';
  } else if (percentage >= 70) {
    progressColor = 'bg-yellow-500 dark:bg-yellow-600';
  }

  const heightClasses = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full flex items-center gap-2', className)}>
      <div className={cn('w-full bg-muted rounded-full overflow-hidden border border-border/10', heightClasses[height])}>
        <div
          className={cn('transition-all duration-500 ease-out rounded-full', progressColor, heightClasses[height])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-xs font-semibold tabular-nums text-muted-foreground w-9 text-right shrink-0">
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  );
};
export default ProgressBar;
