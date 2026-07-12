import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '../common/Loading';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Se estiver carregando a validação inicial de sessão, exibe loading
  if (isLoading) {
    return <Loading fullPage message="Validando credenciais..." />;
  }

  // Se já estiver autenticado, redireciona o usuário para o painel principal
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
};
export default AuthLayout;
