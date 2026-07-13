import { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

export const useChannel = <T = any>(channel: string | null | undefined) => {
  const { connectionManager } = useWebSocket();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!channel || !connectionManager) {
      setLoading(false);
      return;
    }

    setConnected(connectionManager.getReadyState() === WebSocket.OPEN);
    setLoading(true);

    const unsubOpen = connectionManager.onStatus('open', () => {
      setConnected(true);
    });

    const unsubClose = connectionManager.onStatus('close', () => {
      setConnected(false);
    });

    const unsubscribe = connectionManager.subscribe(channel, (messageData: T) => {
      setData(messageData);
      setLoading(false);
    });

    return () => {
      unsubOpen();
      unsubClose();
      unsubscribe();
    };
  }, [channel, connectionManager]);

  return { data, loading, connected };
};
