import React, { createContext, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ConnectionManager } from '@/utils/websocket/ConnectionManager';
import { DashboardSocket } from '@/utils/websocket/DashboardSocket';
import { JobSocket } from '@/utils/websocket/JobSocket';
import { ContainerSocket } from '@/utils/websocket/ContainerSocket';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useJobStore } from '@/stores/jobStore';
import { useContainerStore } from '@/stores/containerStore';

interface WebSocketContextType {
  manager: ConnectionManager | null;
  dashboardSocket: DashboardSocket | null;
  jobSocket: JobSocket | null;
  containerSocket: ContainerSocket | null;
}

export const WebSocketContext = createContext<WebSocketContextType>({
  manager: null,
  dashboardSocket: null,
  jobSocket: null,
  containerSocket: null,
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Recupera a URL do WebSocket do .env
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

  // Cria o ConnectionManager e os Sockets especializados de forma memorizada
  const { manager, dashboardSocket, jobSocket, containerSocket } = useMemo(() => {
    const managerInstance = new ConnectionManager(wsUrl);
    const dashboardSocketInstance = new DashboardSocket(managerInstance);
    const jobSocketInstance = new JobSocket(managerInstance);
    const containerSocketInstance = new ContainerSocket(managerInstance);

    return {
      manager: managerInstance,
      dashboardSocket: dashboardSocketInstance,
      jobSocket: jobSocketInstance,
      containerSocket: containerSocketInstance,
    };
  }, [wsUrl]);

  useEffect(() => {
    // Só conecta se o usuário estiver autenticado
    if (isAuthenticated && token && manager && dashboardSocket && jobSocket && containerSocket) {
      manager.connect();
      dashboardSocket.connect();
      jobSocket.connect();
      containerSocket.connect();

      // Registra listeners nos sockets para atualizar as stores correspondentes
      const unsubMetrics = dashboardSocket.onMetrics((data) => {
        useDashboardStore.getState().updateMetrics(data);
      });

      const unsubJobs = jobSocket.onJobUpdated((data) => {
        useJobStore.getState().addOrUpdateJob(data);
      });

      const unsubContainers = containerSocket.onContainerUpdated((data) => {
        useContainerStore.getState().updateContainer(data);
      });

      // Gerencia o estado de conectado na dashboardStore através dos eventos do ConnectionManager
      const unsubOpen = manager.subscribe('open', () => {
        useDashboardStore.getState().setConnected(true);
      });

      const unsubClose = manager.subscribe('close', () => {
        useDashboardStore.getState().setConnected(false);
      });

      // Atualiza o estado inicial se já conectado
      useDashboardStore.getState().setConnected(manager.getReadyState() === WebSocket.OPEN);

      return () => {
        // Remove os listeners
        unsubMetrics();
        unsubJobs();
        unsubContainers();
        unsubOpen();
        unsubClose();

        // Desconecta canais e fecha conexão
        dashboardSocket.disconnect();
        jobSocket.disconnect();
        containerSocket.disconnect();
        manager.disconnect();

        useDashboardStore.getState().setConnected(false);
      };
    } else {
      if (dashboardSocket) dashboardSocket.disconnect();
      if (jobSocket) jobSocket.disconnect();
      if (containerSocket) containerSocket.disconnect();
      if (manager) manager.disconnect();
      useDashboardStore.getState().setConnected(false);
    }
  }, [isAuthenticated, token, manager, dashboardSocket, jobSocket, containerSocket]);

  const value = useMemo(() => ({
    manager,
    dashboardSocket,
    jobSocket,
    containerSocket,
  }), [manager, dashboardSocket, jobSocket, containerSocket]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
