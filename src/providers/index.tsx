import React from 'react';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './AuthProvider';
import { WebSocketProvider } from './WebSocketProvider';
import { ToastContainer } from '@/components/ui/toast';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            {children}
            <ToastContainer />
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
};
