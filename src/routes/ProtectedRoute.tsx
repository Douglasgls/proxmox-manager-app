import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/common/Loading';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loading fullPage message="Verificando autenticação..." />;
  }

  if (!isAuthenticated) {
    // Salva o caminho que o usuário tentou acessar para redirecionar de volta após login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
export default ProtectedRoute;
