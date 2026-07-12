import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Instanciação única do QueryClient com configurações padrão seguras
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000, // 5 segundos de cache fresco
    },
  },
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
export { queryClient };
