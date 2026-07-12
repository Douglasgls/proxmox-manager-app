import { useContext } from 'react';
import { WebSocketContext } from '@/providers/WebSocketProvider';

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket deve ser utilizado dentro de um WebSocketProvider');
  }
  return context;
};
