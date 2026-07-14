import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, Box } from 'lucide-react';
import { CreateContainerForm } from './CreateContainerForm';
import { JobProgressTracker } from './JobProgressTracker';
import { useCreateContainer, useJobChannel, useTemplates, useBridges } from '../hooks';
import type { CreateContainerDTO } from '../types';

interface CreateContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContainerCreated?: () => void;
}

type ModalView = 'form' | 'tracking';

export const CreateContainerModal: React.FC<CreateContainerModalProps> = ({
  isOpen,
  onClose,
  onContainerCreated,
}) => {
  const [view, setView] = useState<ModalView>('form');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Hooks
  const createMutation = useCreateContainer();
  const { data: templates, isPending: isTemplatesLoading } = useTemplates();
  const { data: bridges, isPending: isBridgesLoading } = useBridges();
  const {
    jobStatus,
    isPending,
    isRunning,
    isCompleted,
    isFailed,
    elapsedSeconds,
  } = useJobChannel(activeJobId);

  const handleSubmit = useCallback(async (dto: CreateContainerDTO) => {
    try {
      const result = await createMutation.mutateAsync(dto);
      setActiveJobId(result.job_id);
      setView('tracking');
    } catch (err) {
      console.error('[CreateContainer] Failed to create:', err);
    }
  }, [createMutation]);

  const handleClose = useCallback(() => {
    // Reset state
    setView('form');
    setActiveJobId(null);

    // Notify parent if container was created successfully
    if (isCompleted && onContainerCreated) {
      onContainerCreated();
    }

    onClose();
  }, [isCompleted, onContainerCreated, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={view === 'form' ? handleClose : undefined}
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
                <Box className="size-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {view === 'form' ? 'Novo Container LXC' : 'Criando Container'}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {view === 'form'
                    ? 'Configure e provisione um novo container no cluster'
                    : 'Acompanhe o progresso em tempo real'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {view === 'form' ? (
              <CreateContainerForm
                templates={templates || []}
                isTemplatesLoading={isTemplatesLoading}
                bridges={bridges || []}
                isBridgesLoading={isBridgesLoading}
                onSubmit={handleSubmit}
                isSubmitting={createMutation.isPending}
              />
            ) : (
              <JobProgressTracker
                jobStatus={jobStatus}
                isPending={isPending}
                isRunning={isRunning}
                isCompleted={isCompleted}
                isFailed={isFailed}
                elapsedSeconds={elapsedSeconds}
                onClose={handleClose}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
