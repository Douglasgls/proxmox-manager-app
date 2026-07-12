import { useDashboardStore } from '@/stores/dashboardStore';
import { useShallow } from 'zustand/react/shallow';

export const useDashboard = () => {
  const metrics = useDashboardStore(
    useShallow((state) => ({
      cpu_usage_percent: state.cpu_usage_percent,
      memory_usage_percent: state.memory_usage_percent,
      memory_used_bytes: state.memory_used_bytes,
      disk_usage_percent: state.disk_usage_percent,
      network_rx_rate: state.network_rx_rate,
      network_tx_rate: state.network_tx_rate,
      containers_running: state.containers_running,
      containers_stopped: state.containers_stopped,
      containers_total: state.containers_total,
      uptime_seconds: state.uptime_seconds,
      lastUpdate: state.lastUpdate,
      // Métricas adicionais suportadas
      swap_used_bytes: state.swap_used_bytes,
      disk_used_bytes: state.disk_used_bytes,
      disk_free_bytes: state.disk_free_bytes,
      rx_bytes: state.rx_bytes,
      tx_bytes: state.tx_bytes,
      load_average: state.load_average,
    }))
  );

  const connected = useDashboardStore((state) => state.connected);

  return {
    metrics,
    connected,
  };
};
