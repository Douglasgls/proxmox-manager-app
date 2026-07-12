import { ConnectionManager } from './ConnectionManager';
import type { JobUpdate } from '@/types/websocket';

export class JobSocket {
  private manager: ConnectionManager;

  constructor(manager: ConnectionManager) {
    this.manager = manager;
  }

  public connect(): void {
    this.manager.subscribeChannel('jobs');
  }

  public disconnect(): void {
    this.manager.unsubscribeChannel('jobs');
  }

  public onJobUpdated(handler: (data: JobUpdate) => void): () => void {
    return this.manager.subscribe('job.updated', handler);
  }

  /**
   * Mantido para retrocompatibilidade com a estrutura de canais legados.
   */
  public subscribeToJob(upid: string, onUpdate: (data: any) => void): () => void {
    this.manager.send('job:subscribe', { upid });
    const unsubscribeMessage = this.manager.subscribe(`job:update:${upid}`, onUpdate);

    return () => {
      this.manager.send('job:unsubscribe', { upid });
      unsubscribeMessage();
    };
  }

  /**
   * Mantido para retrocompatibilidade com a estrutura de canais legados.
   */
  public subscribeToClusterJobs(onNewJob: (data: any) => void): () => void {
    return this.manager.subscribe('job:started', onNewJob);
  }
}
