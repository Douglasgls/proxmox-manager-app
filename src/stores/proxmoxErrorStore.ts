import { create } from 'zustand';

export interface ProxmoxErrorInfo {
  errorCode: 'PROXMOX_PERMISSION_DENIED' | 'PROXMOX_CONNECTION_ERROR' | 'PROXMOX_API_ERROR' | string;
  detail: string;
  requiredPermission?: string | null;
  path?: string | null;
  rawMessage?: string;
  timestamp: number;
}

interface ProxmoxErrorStore {
  error: ProxmoxErrorInfo | null;
  isDismissed: boolean;
  setError: (error: ProxmoxErrorInfo | null) => void;
  clearError: () => void;
  dismiss: () => void;
}

export const useProxmoxErrorStore = create<ProxmoxErrorStore>((set) => ({
  error: null,
  isDismissed: false,
  setError: (error) => set({ error, isDismissed: false }),
  clearError: () => set({ error: null, isDismissed: false }),
  dismiss: () => set({ isDismissed: true }),
}));
