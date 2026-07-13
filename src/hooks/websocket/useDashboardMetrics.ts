import { useChannel } from './useChannel';
import type { DashboardMetrics } from '@/types/websocket';

export const useDashboardMetrics = () => {
  return useChannel<DashboardMetrics>('dashboard.metrics');
};
