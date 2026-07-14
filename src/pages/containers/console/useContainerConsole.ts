import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal as Xterm } from 'xterm';
import { useAuthStore } from '@/stores/authStore';
import { ConsoleSocket } from '@/services/websocket/ConsoleSocket';

export type ConsoleStatus = 'connecting' | 'connected' | 'disconnected';

export const useContainerConsole = (containerId: string) => {
  const [status, setStatus] = useState<ConsoleStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const terminalRef = useRef<Xterm | null>(null);
  const socketRef = useRef<ConsoleSocket | null>(null);
  const token = useAuthStore((state) => state.token);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!token) {
      setError('Usuário não autenticado.');
      setStatus('disconnected');
      return;
    }

    disconnect();
    setStatus('connecting');
    setError(null);

    // Constrói a URL do WebSocket
    const wsUrl = import.meta.env.VITE_WS_URL;
    let consoleWsUrl = wsUrl;
    if (wsUrl.endsWith('/ws')) {
      consoleWsUrl = wsUrl.slice(0, -3) + `/api/console/${containerId}`;
    } else {
      try {
        const urlObj = new URL(wsUrl);
        urlObj.pathname = `/api/console/${containerId}`;
        consoleWsUrl = urlObj.toString();
      } catch (e) {
        consoleWsUrl = wsUrl + `/api/console/${containerId}`;
      }
    }

    const socket = new ConsoleSocket(consoleWsUrl, token);
    socketRef.current = socket;

    socket.connect(
      // onOpen
      () => {
        setStatus('connected');
        if (terminalRef.current) {
          terminalRef.current.clear();
        }
      },
      // onMessage
      (message) => {
        if (message.type === 'output' && message.data) {
          if (terminalRef.current) {
            terminalRef.current.write(message.data);
          }
        }
      },
      // onClose
      (event) => {
        setStatus('disconnected');
        
        let errorMsg = 'Conexão encerrada.';
        if (event.code === 4004) {
          errorMsg = 'O container está desligado. Inicialize o container para acessar o console.';
        } else if (event.code === 4003) {
          errorMsg = 'Container não encontrado.';
        } else if (event.code === 4002 || event.code === 4001) {
          errorMsg = 'Sessão expirada ou token inválido.';
        } else if (event.reason) {
          errorMsg = event.reason;
        }
        
        setError(errorMsg);

        if (terminalRef.current) {
          terminalRef.current.write(`\r\n\x1b[31mConnection closed: ${errorMsg}\x1b[0m\r\n`);
        }
      },
      // onError
      () => {
        setStatus('disconnected');
        setError('Erro de conexão com o servidor.');
        if (terminalRef.current) {
          terminalRef.current.write('\r\n\x1b[31mConnection error.\x1b[0m\r\n');
        }
      }
    );
  }, [containerId, token, disconnect]);

  // Envio de dados digitados
  const handleData = useCallback((data: string) => {
    if (socketRef.current && status === 'connected') {
      socketRef.current.sendInput(data);
    }
  }, [status]);

  // Redimensionamento
  const handleResize = useCallback((cols: number, rows: number) => {
    if (socketRef.current && status === 'connected') {
      socketRef.current.sendResize(cols, rows);
    }
  }, [status]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    error,
    connect,
    disconnect,
    handleData,
    handleResize,
    terminalRef,
  };
};
