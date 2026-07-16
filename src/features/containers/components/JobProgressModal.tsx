import React, { useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, Box, Activity } from 'lucide-react';
import { JobProgressTracker } from './JobProgressTracker';
import { useJobChannel } from '../hooks';

interface JobProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  title: string;
  description: string;
  onComplete?: () => void;
  icon?: React.ReactNode;
}

export const JobProgressModal: React.FC<JobProgressModalProps> = ({
  isOpen,
  onClose,
  jobId,
  title,
  description,
  onComplete,
  icon = <Activity className="size-4 text-primary" />,
}) => {
  const {
    jobStatus,
    isPending,
    isRunning,
    isCompleted,
    isFailed,
    elapsedSeconds,
  } = useJobChannel(jobId);

  useEffect(() => {
    if (isCompleted && onComplete) {
      onComplete();
    }
  }, [isCompleted, onComplete]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={isCompleted || isFailed ? handleClose : undefined}
      />

      {/* Modal Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto w-full max-w-2xl max-h-[85vh] flex flex-col',
            'bg-card border border-border rounded-2xl shadow-2xl',
            'animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                {icon}
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {title}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
            {(isCompleted || isFailed) && (
              <button
                onClick={handleClose}
                className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <JobProgressTracker
              jobStatus={jobStatus}
              isPending={isPending}
              isRunning={isRunning}
              isCompleted={isCompleted}
              isFailed={isFailed}
              elapsedSeconds={elapsedSeconds}
              onClose={handleClose}
            />
          </div>
        </div>
      </div>
    </>
  );
};
