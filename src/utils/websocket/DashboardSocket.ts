import { ConnectionManager } from './ConnectionManager';
import type { DashboardMetrics } from '@/types/websocket';

export class DashboardSocket {
  private manager: ConnectionManager;

  constructor(manager: ConnectionManager) {
    this.manager = manager;
  }

  public connect(): void {
    this.manager.subscribeChannel('dashboard');
  }

  public disconnect(): void {
    this.manager.unsubscribeChannel('dashboard');
  }

  public onMetrics(handler: (data: DashboardMetrics) => void): () => void {
    return this.manager.subscribe('dashboard.metrics.updated', handler);
  }
}
