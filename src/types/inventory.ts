export interface HostInventory {
  hostname: string;
  proxmox_version: string;
  kernel_version: string;
  architecture: string | null;
  cpu_model: string;
  cpu_cores: number;
  cpu_threads: number;
  memory_total_bytes: number;
  swap_total_bytes: number;
  containers_total: number;
  containers_running: number;
  containers_stopped: number;
  containers_locked: number;
  containers_suspended: number;
  iso_count: number;
  template_count: number;
}

export interface HostMetrics {
    cpu_usage_percent: number,
    memory_used_bytes: number,
    memory_free_bytes: number,
    swap_used_bytes: number,
    swap_free_bytes: number,
    disk_used_bytes: number,
    disk_free_bytes: number,
    rx_bytes: number,
    tx_bytes: number,
    load_average: [
      number
    ],
    uptime_seconds: number
}

export interface ProxmoxNode {
  node: string;
  status: 'online' | 'offline';
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  diskUsage: number;
  diskTotal: number;
  uptime: number;
}

export interface StorageResource {
  name: string;
  storage_type: string;
  active: boolean;
  enabled: boolean;
  shared: boolean;
  content_types: string[];
  total_bytes: number;
}

export interface NetworkInterface {
  name: string,
  interface_type: string,
  active: true,
  address: string,
  netmask: string,
  gateway: string
}

export interface NetworksResponse {
  bridges: NetworkInterface[];
  interfaces: NetworkInterface[];
}

export interface InventorySummary {
  nodes: ProxmoxNode[];
  storages: StorageResource[];
  networks: NetworkInterface[];
}
