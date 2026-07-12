export type ContainerStatus = 'running' | 'stopped' | 'paused' | 'unknown';

export interface Container {
  vmid: number;
  name: string;
  status: ContainerStatus;
  node: string;
  type: 'lxc' | 'qemu';
  uptime: number; // em segundos
  cpu: number;    // percentual de uso ex: 0.12 (12%)
  maxcpu: number; // quantidade de cores
  mem: number;    // bytes de memória em uso
  maxmem: number; // bytes totais de memória
  disk: number;   // bytes de disco em uso
  maxdisk: number;// bytes totais de disco
  ipAddress?: string;
}
