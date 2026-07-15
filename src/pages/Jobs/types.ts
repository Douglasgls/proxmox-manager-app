export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Job {
  id: string;
  type: string;
  status: JobStatus;
  progress: number;
  target_container: string;
  container_id: number;
  current_step: string;
  current_component: string;
  output: string;
  error: string;
  started_at: string;
  finished_at: string;
  created_at: string;
}
