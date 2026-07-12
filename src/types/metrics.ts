export interface MetricPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  disk?: number;
  netin?: number;
  netout?: number;
}

export interface MetricHistory {
  targetId: string; // vmid ou nome do nó
  points: MetricPoint[];
}

export interface HostMetrics {
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  diskUsage: number;
  diskTotal: number;
  uptime: number;
  netInSpeed: number;  // bytes/s
  netOutSpeed: number; // bytes/s
}
