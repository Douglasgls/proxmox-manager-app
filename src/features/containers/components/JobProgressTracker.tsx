import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ProgressBar } from '@/components/common/ProgressBar';
import type { ContainerJobStatus } from '../types';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Terminal,
  Box,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JobProgressTrackerProps {
  jobStatus: ContainerJobStatus | null;
  isPending: boolean;
  isRunning: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  elapsedSeconds: number;
  onClose: () => void;
  onViewContainer?: () => void;
}

/**
 * Formata segundos em "MM:SS" ou "HH:MM:SS".
 */
const formatElapsed = (totalSeconds: number): string => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
};

export const JobProgressTracker: React.FC<JobProgressTrackerProps> = ({
  jobStatus,
  isPending,
  isRunning,
  isCompleted,
  isFailed,
  elapsedSeconds,
  onClose,
  onViewContainer,
}) => {
  const outputRef = useRef<HTMLPreElement>(null);

  // Auto-scroll terminal output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [jobStatus?.output]);

  const isDone = isCompleted || isFailed;

  return (
    <div className="flex flex-col h-full">
      {/* Header status */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {isPending && (
            <div className="size-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Clock className="size-5 text-yellow-500 animate-pulse" />
            </div>
          )}
          {isRunning && (
            <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Loader2 className="size-5 text-blue-500 animate-spin" />
            </div>
          )}
          {isCompleted && (
            <div className="size-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="size-5 text-green-500" />
            </div>
          )}
          {isFailed && (
            <div className="size-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <XCircle className="size-5 text-red-500" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {isPending && 'Aguardando início...'}
              {isRunning && 'Provisionando container...'}
              {isCompleted && 'Container criado com sucesso!'}
              {isFailed && 'Falha na criação'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {jobStatus?.job_id ? `Job: ${jobStatus.job_id.slice(0, 8)}...` : 'Iniciando job...'}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground tabular-nums">
          <Clock className="size-3.5" />
          {formatElapsed(elapsedSeconds)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">Progresso</span>
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {jobStatus?.progress ?? 0}%
          </span>
        </div>
        <ProgressBar
          value={jobStatus?.progress ?? 0}
          height="md"
          className={cn(
            isCompleted && '[&_div_div]:bg-green-500',
            isFailed && '[&_div_div]:bg-red-500',
          )}
        />
      </div>

      {/* Current Step */}
      {jobStatus?.current_step && (
        <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-muted/50 border border-border/50">
          <Wrench className={cn('size-3.5 text-primary shrink-0', isRunning && 'animate-spin')} />
          <span className="text-xs font-medium text-foreground truncate">
            {jobStatus.current_step}
          </span>
          {jobStatus.current_component && (
            <span className="ml-auto text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
              {jobStatus.current_component}
            </span>
          )}
        </div>
      )}

      {/* Container ID info */}
      {jobStatus?.container_id && (
        <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
          <Box className="size-3.5" />
          <span>Container ID: <strong className="text-foreground">{jobStatus.container_id}</strong></span>
        </div>
      )}

      {/* Terminal Output */}
      <div className="flex-1 min-h-0 mb-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Terminal className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Output</span>
        </div>
        <pre
          ref={outputRef}
          className={cn(
            'h-48 overflow-y-auto rounded-lg border border-border bg-[#0d1117] text-[11px] leading-relaxed p-3',
            'font-mono text-green-400 scrollbar-thin selection:bg-green-900/40',
            isFailed && 'text-red-400',
          )}
        >
          {jobStatus?.output || (
            isFailed ? (
              <span className="text-red-400 font-semibold">
                Erro: {jobStatus?.error || 'Falha ao iniciar o provisionamento ou conexão perdida.'}
              </span>
            ) : (
              <span className="text-muted-foreground/60 italic">Aguardando output...</span>
            )
          )}
        </pre>
      </div>

      {/* Error message */}
      {isFailed && jobStatus?.error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs font-semibold text-red-500 mb-1">Erro:</p>
          <p className="text-xs text-red-400 font-mono whitespace-pre-wrap">{jobStatus.error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
        {isDone && isCompleted && onViewContainer && (
          <Button size="sm" onClick={onViewContainer} className="gap-1.5">
            <Box className="size-3.5" />
            Ver Container
          </Button>
        )}
        <Button
          variant={isDone ? 'default' : 'outline'}
          size="sm"
          onClick={onClose}
        >
          {isDone ? 'Fechar' : 'Cancelar'}
        </Button>
      </div>
    </div>
  );
};
