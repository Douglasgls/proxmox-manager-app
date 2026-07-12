import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Carregando...',
  className,
  size = 'md',
  fullPage = false,
}) => {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-8',
    lg: 'size-12',
  };

  const containerClasses = cn(
    'flex flex-col items-center justify-center gap-3 text-muted-foreground',
    fullPage ? 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 h-screen w-screen' : 'w-full py-8',
    className
  );

  return (
    <div className={containerClasses}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {message && <span className="text-sm font-medium">{message}</span>}
    </div>
  );
};
export default Loading;
