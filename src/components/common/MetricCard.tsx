import React from 'react';
import { Card, CardContent } from '../ui/card';
import { ProgressBar } from './ProgressBar';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number; // Uso atual
  total?: number; // Total alocado (opcional)
  icon: LucideIcon;
  formatValue?: (val: number) => string;
  formatTotal?: (val: number) => string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  total,
  icon: Icon,
  formatValue = (v) => `${v}`,
  formatTotal = (t) => `${t}`,
  className,
}) => {
  const percentage = total && total > 0 ? (value / total) * 100 : value;

  return (
    <Card className={cn('hover:shadow-md transition-shadow duration-200', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Icon className="size-5" />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight">
              {formatValue(value)}
            </span>
            {total !== undefined && (
              <span className="text-xs text-muted-foreground">
                de {formatTotal(total)}
              </span>
            )}
          </div>

          <ProgressBar value={percentage} showPercentage />
        </div>
      </CardContent>
    </Card>
  );
};
export default MetricCard;
