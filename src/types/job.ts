export type JobStatus = 'running' | 'done' | 'failed' | 'stopped';

export interface Job {
  id: string;
  upid: string; // ID único de tarefa do Proxmox
  node: string;
  user: string;
  type: string; // ex: vzstart, qmclone, etc.
  status: JobStatus;
  exitstatus?: string;
  starttime: number; // timestamp
  endtime?: number;   // timestamp
  progress?: number;  // 0 a 100
}
