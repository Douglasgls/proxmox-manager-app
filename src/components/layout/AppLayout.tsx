import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAgentStatus } from '@/hooks/useAgentStatus';
import { Loading } from '../common/Loading';
import ErrorBoundary from '../common/ErrorBoundary';
import Sidebar from './Sidebar';
import Header from './Header';
import { ProxmoxErrorBanner } from '../common/ProxmoxErrorBanner';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isNotConfigured } = useAgentStatus();
  const location = useLocation();

  // Se estiver validando o token ou buscando usuário
  if (isLoading) {
    return <Loading fullPage message="Carregando painel administrativo..." />;
  }

  // Redireciona se não estiver logado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se o Agent não estiver configurado, força a navegação para a tela de Configurações
  if (isNotConfigured && location.pathname !== '/app/settings') {
    return <Navigate to="/app/settings" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#101010] text-foreground">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden bg-[#101010]">
        {/* Header */}
        <Header />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#101010]">
          <div className="w-full">
            <ProxmoxErrorBanner />
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};
export default AppLayout;
