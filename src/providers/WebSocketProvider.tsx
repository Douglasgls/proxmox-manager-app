import React, { createContext, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ConnectionManager } from '@/utils/websocket/ConnectionManager';
import { JobSocket } from '@/utils/websocket/JobSocket';
import { useDashboardStore } from '@/stores/dashboardStore';

interface WebSocketContextType {
  connectionManager: ConnectionManager | null;
  // Keep legacy properties for backward compatibility
  manager: ConnectionManager | null;
  jobSocket: JobSocket | null;
}

export const WebSocketContext = createContext<WebSocketContextType>({
  connectionManager: null,
  manager: null,
  jobSocket: null,
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Recupera a URL do WebSocket do .env
  const wsUrl = import.meta.env.VITE_WS_URL;

  // Cria o ConnectionManager e JobSocket (para compatibilidade)
  const { connectionManager, jobSocket } = useMemo(() => {
    const managerInstance = new ConnectionManager(wsUrl);
    const jobSocketInstance = new JobSocket(managerInstance);

    return {
      connectionManager: managerInstance,
      jobSocket: jobSocketInstance,
    };
  }, [wsUrl]);

  useEffect(() => {
    // Só conecta se o usuário estiver autenticado
    if (isAuthenticated && token && connectionManager && jobSocket) {
      connectionManager.connect();
      jobSocket.connect();

      // Gerencia o estado de conectado na dashboardStore através dos eventos do ConnectionManager
      const unsubOpen = connectionManager.onStatus('open', () => {
        useDashboardStore.getState().setConnected(true);
      });

      const unsubClose = connectionManager.onStatus('close', () => {
        useDashboardStore.getState().setConnected(false);
      });

      // Atualiza o estado inicial se já conectado
      useDashboardStore.getState().setConnected(connectionManager.getReadyState() === WebSocket.OPEN);

      return () => {
        // Remove os listeners
        unsubOpen();
        unsubClose();

        // Desconecta canais e fecha conexão
        jobSocket.disconnect();
        connectionManager.disconnect();

        useDashboardStore.getState().setConnected(false);
      };
    } else {
      if (jobSocket) jobSocket.disconnect();
      if (connectionManager) connectionManager.disconnect();
      useDashboardStore.getState().setConnected(false);
    }
  }, [isAuthenticated, token, connectionManager, jobSocket]);

  const value = useMemo(() => ({
    connectionManager,
    manager: connectionManager,
    jobSocket,
  }), [connectionManager, jobSocket]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
