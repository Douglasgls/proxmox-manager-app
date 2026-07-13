import { useChannel } from './useChannel';

export interface HostMetrics {
  cpu_usage_percent: number;
  memory_used_bytes: number;
  memory_free_bytes: number;
  swap_used_bytes: number;
  swap_free_bytes: number;
  disk_used_bytes: number;
  disk_free_bytes: number;
  rx_bytes: number;
  tx_bytes: number;
  load_average: number[];
  uptime_seconds: number;
}

export const useHostMetrics = () => {
  return useChannel<HostMetrics>('host.metrics');
};
