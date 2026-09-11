import type { Container } from './container';
import type { Job } from './job';

export interface WsEnvelope<T> {
  event: string;
  data: T;
}

export interface DashboardMetrics {
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
  // Campos adicionais da API para compatibilidade e fallback sem perda de dados
  swap_used_bytes?: number;
  disk_used_bytes?: number;
  disk_free_bytes?: number;
  rx_bytes?: number;
  tx_bytes?: number;
  load_average?: number[];
}

export interface ContainerUpdate {
  vmid: number;
  name?: string;
  status?: Container['status'];
  node?: string;
  type?: Container['type'];
  uptime?: number;
  cpu?: number;
  maxcpu?: number;
  mem?: number;
  maxmem?: number;
  disk?: number;
  maxdisk?: number;
  ipAddress?: string;
}

export interface JobUpdate {
  upid: string;
  id?: string;
  node?: string;
  user?: string;
  type?: string;
  status?: Job['status'];
  exitstatus?: string;
  starttime?: number;
  endtime?: number;
  progress?: number;
}

export interface NodeSyncRequest {
  type: 'node.sync.request';
  request_id?: string;
}

export interface HeadscaleSyncNode {
  headscale_node_id: string;
  hostname: string;
  name: string;
  machine_key: string;
  node_key: string;
  user: string;
  tags?: string[];
  tailscale_ip: string;
  ephemeral: boolean;
  last_seen: string;
  expiration: string;
  online: boolean;
  expired: boolean;
  api_local_container_id?: string | number | null;
}

export interface NodeSyncResponsePayload {
  nodes: HeadscaleSyncNode[];
}

export interface NodeSyncResponse {
  request_id?: string;
  type: 'node.sync.response';
  success: boolean;
  payload?: NodeSyncResponsePayload;
  error?: string;
  message?: string;
}

