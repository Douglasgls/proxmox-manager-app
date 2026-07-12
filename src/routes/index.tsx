import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

// Layouts
import AppLayout from '@/components/layout/AppLayout';
import AuthLayout from '@/components/layout/AuthLayout';

// Páginas
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Containers from '@/pages/Containers';
import Jobs from '@/pages/Jobs';
import Monitoring from '@/pages/Monitoring';
import Inventory from '@/pages/Inventory';
import Settings from '@/pages/Settings';

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
