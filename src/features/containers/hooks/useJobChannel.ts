import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { ContainerJobStatus } from '../types';

interface UseJobChannelReturn {
  jobStatus: ContainerJobStatus | null;
  isRunning: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  isPending: boolean;
  elapsedSeconds: number;
}

/**
 * Hook que se inscreve no canal WebSocket `jobs.<jobId>` para
 * receber atualizações em tempo real do progresso de criação de um container.
 *
 * Faz unsubscribe automaticamente quando o job finaliza (COMPLETED ou FAILED).
 */
export const useJobChannel = (jobId: string | null): UseJobChannelReturn => {
  const { connectionManager } = useWebSocket();
  const [jobStatus, setJobStatus] = useState<ContainerJobStatus | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  // Cleanup timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Subscribe to the job channel
  useEffect(() => {
    if (!jobId || !connectionManager) return;

    // Reset state for new job
    setJobStatus(null);
    setElapsedSeconds(0);

    // Start elapsed timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Subscribe to the job channel
    const channel = `jobs.${jobId}`;
    unsubRef.current = connectionManager.subscribe(channel, (data: ContainerJobStatus) => {
      setJobStatus(data);

      // Auto-unsubscribe when the job is done
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        clearTimer();
        // Small delay to ensure the last message is processed
        setTimeout(() => {
          if (unsubRef.current) {
            unsubRef.current();
            unsubRef.current = null;
          }
        }, 500);
      }
    });

    return () => {
      clearTimer();
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [jobId, connectionManager, clearTimer]);

  const status = jobStatus?.status;

  return {
    jobStatus,
    isPending: !status || status === 'PENDING',
    isRunning: status === 'RUNNING',
    isCompleted: status === 'COMPLETED',
    isFailed: status === 'FAILED',
    elapsedSeconds,
  };
};
