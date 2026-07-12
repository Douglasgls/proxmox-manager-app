import { useAuth } from './useAuth';

export const useUser = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  return {
    user,
    isAuthenticated,
    isLoading,
    role: user?.role || null,
    isAdmin: user?.role === 'admin',
  };
};
