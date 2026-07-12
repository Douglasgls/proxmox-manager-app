import { create } from 'zustand';
import type { DashboardMetrics } from '@/types/websocket';

export interface DashboardStoreState {
  cpu_usage_percent: number;
  memory_usage_percent: number;
  memory_used_bytes: number;
  disk_usage_percent: number;
  network_rx_rate: number;
  network_tx_rate: number;
  containers_running: number;
  containers_stopped: number;
  containers_total: number;
  uptime_seconds: number;
  connected: boolean;
  lastUpdate: string | null;

  // Campos extras para suporte completo e retrocompatibilidade sem perda de dados
  swap_used_bytes: number;
  disk_used_bytes: number;
  disk_free_bytes: number;
  rx_bytes: number;
  tx_bytes: number;
  load_average: number[];

  setConnected: (connected: boolean) => void;
  updateMetrics: (metrics: Partial<DashboardMetrics>) => void;
}

export const useDashboardStore = create<DashboardStoreState>((set) => ({
  cpu_usage_percent: 0,
  memory_usage_percent: 0,
  memory_used_bytes: 0,
  disk_usage_percent: 0,
  network_rx_rate: 0,
  network_tx_rate: 0,
  containers_running: 0,
  containers_stopped: 0,
  containers_total: 0,
  uptime_seconds: 0,
  connected: false,
  lastUpdate: null,

  swap_used_bytes: 0,
  disk_used_bytes: 0,
  disk_free_bytes: 0,
  rx_bytes: 0,
  tx_bytes: 0,
  load_average: [0, 0, 0],

  setConnected: (connected) => set({ connected }),
  updateMetrics: (metrics) => set((state) => ({
    ...state,
    ...metrics,
    lastUpdate: new Date().toISOString(),
  })),
}));
