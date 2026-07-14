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
  ip_address?: string | null;
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

// ─── Container Creation Types ───────────────────────────────────────────────

export type IpMode = 'dhcp' | 'static';

export interface CreateContainerDTO {
  name: string;
  password: string;
  cpu: number;
  memory_mb: number;
  disk_gb: number;
  image_name: string;
  bridge: string;
  ip_mode: IpMode;
  ip_address: string | null;
  cidr: string | null;
  gateway: string | null;
  firewall: boolean;
  mtu: number | null;
  vlan: number | null;
  mac_address: string | null;
  components: string[];
}

export interface JobCreatedResponse {
  job_id: string;
}

export type ContainerJobStatusType = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ContainerJobStatus {
  event: string;
  job_id: string;
  type: string;
  status: ContainerJobStatusType;
  progress: number;
  current_step: string | null;
  current_component: string | null;
  container_id: number | null;
  target_container: string | null;
  output: string | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string | null;
}

export interface TemplateImage {
  name: string;
  filename: string;
  distribution: string;
  version: string;
  architecture: string;
  description: string | null;
  storage: string;
  downloaded: boolean;
  size: number;
  source: string;
  volume_id: string;
}

export interface AvailableComponent {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
}
