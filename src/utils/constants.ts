/**
 * Constantes globais do sistema Proxmox Manager
 */
export const ROUTES = {
  LOGIN: '/login',
  APP: '/app',
  DASHBOARD: '/app/dashboard',
  CONTAINERS: '/app/containers',
  JOBS: '/app/jobs',
  MONITORING: '/app/monitoring',
  INVENTORY: '/app/inventory',
  SETTINGS: '/app/settings',
} as const;

export const STORAGE_KEYS = {
  AUTH: 'proxmox-auth-storage',
  THEME: 'proxmox-theme-storage',
  UI: 'proxmox-ui-storage',
} as const;

export const CONTAINER_STATUS_COLORS = {
  running: 'text-green-500 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
  stopped: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
  paused: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900',
  locked: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900',
  suspended: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900',
  unknown: 'text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900',
} as const;

export const JOB_STATUS_COLORS = {
  running: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900',
  done: 'text-green-500 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
  failed: 'text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900',
  stopped: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
  pending: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900',
  completed: 'text-green-500 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
} as const;
