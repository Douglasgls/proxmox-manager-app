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
  storage: string;
  node: string;
  type: string; // dir, lvm, nfs, zfs, etc.
  shared: boolean;
  active: boolean;
  used: number;  // bytes
  total: number; // bytes
}

export interface NetworkInterface {
  iface: string;
  node: string;
  type: string; // eth, bridge, bond, vlan
  active: boolean;
  address?: string;
  netmask?: string;
  gateway?: string;
  ports?: string;
}

export interface InventorySummary {
  nodes: ProxmoxNode[];
  storages: StorageResource[];
  networks: NetworkInterface[];
}
