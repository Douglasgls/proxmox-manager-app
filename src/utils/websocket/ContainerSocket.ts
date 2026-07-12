import { ConnectionManager } from './ConnectionManager';
import type { ContainerUpdate } from '@/types/websocket';

export class ContainerSocket {
  private manager: ConnectionManager;

  constructor(manager: ConnectionManager) {
    this.manager = manager;
  }

  public connect(): void {
    this.manager.subscribeChannel('containers');
  }

  public disconnect(): void {
    this.manager.unsubscribeChannel('containers');
  }

  public onContainerUpdated(handler: (data: ContainerUpdate) => void): () => void {
    return this.manager.subscribe('container.updated', handler);
  }
}
