export type AgentReadiness = 'READY' | 'NOT_CONFIGURED' | string;

export interface AgentStatusResponse {
  version: string;
  agent_status: string;
  readiness: AgentReadiness;
  message?: string;
}

export interface ProxmoxTestConnectionDTO {
  proxmox_host: string;
  proxmox_user: string;
  proxmox_token_name: string;
  proxmox_token_value: string;
  proxmox_node: string;
}

export interface ProxmoxConfigDTO {
  proxmox_host: string;
  proxmox_user: string;
  proxmox_token_name: string;
  proxmox_token_value?: string;
  proxmox_node: string;
  default_storage?: string | null;
  default_template?: string | null;
}

export interface ProxmoxConfigResponse {
  configured: boolean;
  proxmox_host: string;
  proxmox_user: string;
  proxmox_token_name: string;
  proxmox_node: string;
  default_storage?: string | null;
  default_template?: string | null;
  message?: string;
}

export interface AgentActionResponse {
  status?: string;
  message?: string;
  detail?: string;
  success?: boolean;
}
