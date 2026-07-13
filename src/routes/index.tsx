import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

// Layouts
import AppLayout from '@/components/layout/AppLayout';
import AuthLayout from '@/components/layout/AuthLayout';

// Páginas
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Containers from '@/pages/Containers';
import ContainerDetails from '@/features/containers/pages/ContainerDetailsPage';
import Jobs from '@/pages/Jobs';
import Monitoring from '@/pages/Monitoring';
import Inventory from '@/pages/Inventory';
import Settings from '@/pages/Settings';

const ContainerRedirect: React.FC = () => {
  const { containerId } = useParams<{ containerId: string }>();
  return <Navigate to={`/app/containers/${containerId}`} replace />;
};

export const router = createBrowserRouter([
  // Rotas Públicas (Protegidas contra usuários já autenticados)
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/login',
            element: <Login />,
          },
        ],
      },
    ],
  },

  // Rotas Privadas (Protegidas contra usuários não autenticados)
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '',
            element: <Navigate to="/app/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'containers',
            element: <Containers />,
          },
          {
            path: 'containers/:containerId',
            element: <ContainerDetails />,
          },
          {
            path: 'jobs',
            element: <Jobs />,
          },
          {
            path: 'monitoring',
            element: <Monitoring />,
          },
          {
            path: 'inventory',
            element: <Inventory />,
          },
          {
            path: 'settings',
            element: <Settings />,
          },
        ],
      },
    ],
  },

  // Redirect for old path
  {
    path: '/containers/:containerId',
    element: <ContainerRedirect />,
  },

  // Redirecionamento da raiz do site
  {
    path: '/',
    element: <Navigate to="/app/dashboard" replace />,
  },

  // Rota Fallback (Catch-all)
  {
    path: '*',
    element: <Navigate to="/app/dashboard" replace />,
  },
]);

export default router;
