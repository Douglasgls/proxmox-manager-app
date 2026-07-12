type MessageHandler = (data: any) => void;

export class ConnectionManager {
  private ws: WebSocket | null = null;
  private url: string;
  private autoReconnect: boolean = true;
  private reconnectInterval: number = 2000;
  private maxReconnectAttempts: number = 5;
  private reconnectAttempts: number = 0;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private activeChannels: Set<string> = new Set();

  constructor(url: string) {
    this.url = url;
  }

  public connect(): void {
    this.autoReconnect = true; // Permite reconectar caso tenha sido desconectado anteriormente
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WS] Connected to', this.url);
        this.reconnectAttempts = 0;
        this.trigger('open', null);

        // Reinscrever todos os canais que estavam ativos antes da queda/reconexão
        this.activeChannels.forEach((channel) => {
          this.sendSubscriptionMessage('subscribe', channel);
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { event: eventName, data } = message;
          if (eventName) {
            this.trigger(eventName, data);
          }
          this.trigger('*', message); // Listener global
        } catch (err) {
          console.error('[WS] Failed to parse message', err);
          this.trigger('raw_message', event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[WS] Disconnected', event);
        this.trigger('close', event);
        if (this.autoReconnect) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error', error);
        this.trigger('error', error);
      };
    } catch (error) {
      console.error('[WS] Connection attempt failed', error);
      this.attemptReconnect();
    }
  }

  public disconnect(): void {
    this.autoReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public send(event: string, data: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Cannot send message, socket is not open');
      return;
    }
    this.ws.send(JSON.stringify({ event, data }));
  }

  public subscribeChannel(channel: string): void {
    this.activeChannels.add(channel);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscriptionMessage('subscribe', channel);
    }
  }

  public unsubscribeChannel(channel: string): void {
    this.activeChannels.delete(channel);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscriptionMessage('unsubscribe', channel);
    }
  }

  private sendSubscriptionMessage(action: 'subscribe' | 'unsubscribe', channel: string): void {
    try {
      this.ws?.send(JSON.stringify({ action, channel }));
      console.log(`[WS] Sent ${action} for channel: ${channel}`);
    } catch (err) {
      console.error(`[WS] Failed to send ${action} message for channel ${channel}`, err);
    }
  }

  public subscribe(event: string, handler: MessageHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Retorna função de unsubscribe
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(handler);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  private trigger(event: string, data: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (err) {
          console.error('[WS] Error executing event handler for', event, err);
        }
      });
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WS] Max reconnect attempts reached');
      this.trigger('max_reconnect', null);
      return;
    }

    this.reconnectAttempts++;
    const backoff = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[WS] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${backoff}ms`);

    setTimeout(() => {
      this.connect();
    }, backoff);
  }

  public getReadyState(): number {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }
}
