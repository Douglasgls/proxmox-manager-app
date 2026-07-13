export interface ContainerInventory {
  id: string;
  container_id: number;
  name: string;
  status: string;
  locked: boolean;
  lock: string | null;
  cpu_cores: number;
  memory_total_bytes: number;
  disk_total_bytes: number;
}

export interface ContainerMetrics {
  id?: string;
  container_id: number;
  cpu_usage_percent: number;
  memory_used_bytes: number;
  memory_usage_percent: number;
  swap_used_bytes: number;
  disk_used_bytes: number;
  disk_usage_percent: number;
  rx_bytes: number;
  tx_bytes: number;
  io_read_bytes: number;
  io_write_bytes: number;
  status: string;
  uptime_seconds: number;
}

export interface ContainerInventoryResponse {
  containers: ContainerInventory[];
  total: number;
  running: number;
  stopped: number;
  locked: number;
  suspended: number;
}

export interface ContainerActionResponse {
  container_id: string;
  container_number: number;
  operation: string;
  success: boolean;
  message: string;
  status: string;
}
